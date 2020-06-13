import { AfterContentChecked, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { Observable } from 'rxjs';

import { coerceToAsyncValidator, coerceToValidator } from './abstract-control-utils';
import {
  ArrayPropertyKey,
  ControlMap,
  Controls,
  ControlsNames,
  ControlsType,
  FormErrors,
  isNullOrUndefined,
  TypedAbstractControl,
} from './ngx-sub-form-utils';
import { FormGroupOptions, NgxFormWithArrayControls, TypedSubFormGroup } from './ngx-sub-form.types';
import { patchFormControl, SubFormGroup } from './sub-form-group';

type MapControlFunction<FormInterface, MapValue> = (ctrl: AbstractControl, key: keyof FormInterface) => MapValue;
type FilterControlFunction<FormInterface> = (
  ctrl: TypedAbstractControl<any>,
  key: keyof FormInterface,
  isCtrlWithinFormArray: boolean,
) => boolean;

export abstract class NgxSubFormComponent<ControlInterface, FormInterface = ControlInterface>
  implements OnDestroy, OnChanges, AfterContentChecked {
  public get formGroupErrors(): FormErrors<FormInterface> {
    return {};
    // TODO figure out how to deal with errors
    // const errors: FormErrors<FormInterface> = this.mapControls<ValidationErrors | ValidationErrors[] | null>(
    //   ctrl => ctrl.errors,
    //   (ctrl, _, isCtrlWithinFormArray) => (isCtrlWithinFormArray ? true : ctrl.invalid),
    //   true,
    // ) as FormErrors<FormInterface>;

    // if (!this.formGroup.errors && (!errors || !Object.keys(errors).length)) {
    //   return null;
    // }

    // return Object.assign({}, this.formGroup.errors ? { formGroup: this.formGroup.errors } : {}, errors);
  }

  public get formControlNames(): ControlsNames<FormInterface> {
    // see @note form-group-undefined for as syntax
    return this.mapControls(
      (_, key) => key,
      () => true,
      false,
    ) as ControlsNames<FormInterface>;
  }

  private controlKeys: (keyof FormInterface)[] = [];

  // when developing the lib it's a good idea to set the formGroup type
  // to current + `| undefined` to catch a bunch of possible issues
  // see @note form-group-undefined

  // tslint:disable-next-line: no-input-rename
  @Input('subForm') formGroup!: TypedSubFormGroup<ControlInterface, FormInterface>; // | SubFormArray<ControlInterface, FormInterface>;

  protected emitNullOnDestroy = true;
  protected emitInitialValueOnInit = true;

  // can't define them directly
  protected abstract getFormControls(): Controls<FormInterface>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataInput'] === undefined && changes['formGroup'] === undefined) {
      return;
    }

    // TODO rethink if this can ever be a sub form array
    if (!(this.formGroup instanceof SubFormGroup)) {
      // || this.formGroup instanceof SubFormArray)) {
      throw new Error('The subForm input needs to be of type SubFormGroup.');
    }

    Object.keys(this.formGroup.controls).forEach(key => {
      this.formGroup.removeControl(key);
    });

    // TODO change type of formGroup to be derived form SubFormGroup / SubFormArray then remove as any
    // connect the sub form component to the SubFormGroup / SubFormArray
    const subForm = (this.formGroup as unknown) as SubFormGroup<ControlInterface, FormInterface>;

    const controls = this.getFormControls();
    for (const key in controls) {
      if (controls.hasOwnProperty(key)) {
        const control = controls[key];

        // we need to wire up the form controls with the sub form group
        // this allows us to transform the sub form value to ControlInterface
        // every time any of the form controls on the sub form change
        if (control instanceof FormControl) {
          patchFormControl(subForm, control);
        }

        this.formGroup.addControl(key, control);
      }
    }

    subForm.setSubForm(this);

    this.controlKeys = (Object.keys(controls) as unknown) as (keyof FormInterface)[];

    const options = this.getFormGroupControlOptions() as AbstractControlOptions;

    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    // get validators that were passed into the sub form group on the parent
    if (subForm.parentValidatorOrOpts) {
      const validator = coerceToValidator(subForm.parentValidatorOrOpts);
      if (validator) {
        validators.push(validator);
      }
    }

    // get async validators that were passed into the sub form group on the parent
    if (subForm.parentAsyncValidator) {
      const validator = coerceToAsyncValidator(subForm.parentAsyncValidator);
      if (validator) {
        asyncValidators.push(validator);
      }
    }

    // handle AbstractControlOptions from getFormGroupControlOptions
    if (options) {
      if (options.updateOn) {
        // sadly there is no public metohd that lets us change the update strategy of an already created FormGroup
        (this.formGroup as any)._setUpdateStrategy(options.updateOn);
      }

      if (options.validators) {
        const validator = coerceToValidator(options.validators);
        if (validator) {
          validators.push(validator);
        }
      }

      if (options.asyncValidators) {
        const validator = coerceToAsyncValidator(options.asyncValidators);
        if (validator) {
          asyncValidators.push(validator);
        }
      }
    }

    // set validators / async validators on sub form group
    if (validators.length > 0) {
      this.formGroup.setValidators(validators);
    }
    if (asyncValidators.length > 0) {
      this.formGroup.setAsyncValidators(asyncValidators);
    }

    // if the form has default values, they should be applied straight away
    const defaultValues: Partial<FormInterface> | null = this.getDefaultValues();

    // get default values for reset, if null fallback to undefined as there si a difference when calling reset
    const transformedValue = this.transformFromFormGroup(defaultValues as FormInterface) || undefined;
    // since this is the initial setting of form values do NOT emit an event

    let mergedValues: ControlInterface;
    if (Array.isArray(transformedValue)) {
      mergedValues = subForm.controlValue;
    } else {
      const controlValue = (changes['dataInput'] ? (this as any)['dataInput'] : subForm.controlValue) || {};
      mergedValues = { ...transformedValue, ...controlValue } as ControlInterface;
    }

    const formValue = this.transformToFormGroup(mergedValues, {});
    this.handleFormArrayControls(formValue);

    // self = false is critical here
    // this allows the parent form to re-evaluate its status after each of its sub form has completed intialization
    // we actually only need to call this on the deepest sub form in a tree (leaves)
    // but there is no way to identify if there are sub forms on the current form + that are also rendered
    // as only when sub forms are rendered the on changes method on the sub form is executed

    // TODO decide if we want to emit an event when input control value != control value after intialization
    // this happens for example when null is passed in but default values change the value of the inner form
    this.formGroup.reset(mergedValues, { onlySelf: false, emitEvent: false });
  }

  ngAfterContentChecked(): void {
    // checking if the form group has a change detector (root forms might not)
    if (this.formGroup.cd) {
      // if this is the root form
      // OR if ist a sub form but the root form does not have a change detector
      // we need to actually run change detection vs just marking for check
      if (!this.formGroup.parent && (this.formGroup.root as any).cd) {
        this.formGroup.cd.detectChanges();
      } else {
        this.formGroup.cd.markForCheck();
      }
    }
  }

  // @todo could this be removed to avoid an override and just use `takeUntilDestroyed`?
  public ngOnDestroy(): void {
    // @hack there's a memory leak within Angular and those components
    // are not correctly cleaned up which leads to error if a form is defined
    // with validators and then it's been removed, the validator would still fail
    // `as any` if because we do not want to define the formGroup as FormGroup | undefined
    // everything related to undefined is handled internally and shouldn't be exposed to end user
    (this.formGroup as any) = undefined;

    // TODO see if we still need this as this would require handling of some special value inside the SubFromGroup / SubFromArray
    // this is because the chanegs stream comes directly out of the formGroup so there is on way to plug it in
    // if (this.emitNullOnDestroy) {
    //   this.formGroup.setValue(null as any);
    // }
  }

  private mapControls<MapValue>(
    mapControl: MapControlFunction<FormInterface, MapValue>,
    filterControl: FilterControlFunction<FormInterface>,
    recursiveIfArray: boolean,
  ): Partial<ControlMap<FormInterface, MapValue | MapValue[]>> | null;
  private mapControls<MapValue>(
    mapControl: MapControlFunction<FormInterface, MapValue>,
  ): ControlMap<FormInterface, MapValue | MapValue[]> | null;
  private mapControls<MapValue>(
    mapControl: MapControlFunction<FormInterface, MapValue>,
    filterControl: FilterControlFunction<FormInterface> = () => true,
    recursiveIfArray: boolean = true,
  ): Partial<ControlMap<FormInterface, MapValue | MapValue[]>> | null {
    if (!this.formGroup) {
      return null;
    }

    const formControls: ControlsType<FormInterface> = this.formGroup.controls;

    const controls: Partial<ControlMap<FormInterface, MapValue | MapValue[]>> = {};

    for (const key in formControls) {
      if (this.formGroup.controls.hasOwnProperty(key)) {
        const control = formControls[key];

        if (recursiveIfArray && control instanceof FormArray) {
          const values: MapValue[] = [];

          for (let i = 0; i < control.length; i++) {
            if (filterControl(control.at(i), key, true)) {
              values.push(mapControl(control.at(i), key));
            }
          }

          if (values.length > 0 && values.some(x => !isNullOrUndefined(x))) {
            controls[key] = values;
          }
        } else if (control && filterControl(control, key, false)) {
          controls[key] = mapControl(control, key);
        }
      }
    }

    return controls;
  }

  /**
   * Extend this method to provide custom local FormGroup level validation
   */
  protected getFormGroupControlOptions(): FormGroupOptions<FormInterface> {
    return {};
  }

  // when getDefaultValues is defined, you do not need to specify the default values
  // in your form (the ones defined within the `getFormControls` method)
  protected getDefaultValues(): Partial<FormInterface> {
    return {};
  }

  public handleFormArrayControls(obj: any) {
    if (!this.formGroup) {
      debugger;
    }

    Object.entries(obj).forEach(([key, value]) => {
      if (this.formGroup.get(key) instanceof FormArray && Array.isArray(value)) {
        const formArray: FormArray = this.formGroup.get(key) as FormArray;

        // instead of creating a new array every time and push a new FormControl
        // we just remove or add what is necessary so that:
        // - it is as efficient as possible and do not create unnecessary FormControl every time
        // - validators are not destroyed/created again and eventually fire again for no reason
        while (formArray.length > value.length) {
          formArray.removeAt(formArray.length - 1);
        }

        for (let i = formArray.length; i < value.length; i++) {
          // TODO decide if this is the best way forward as it implies only a single form array on a sub form
          if (this.formIsFormWithArrayControls()) {
            formArray.insert(i, this.createFormArrayControl(key as ArrayPropertyKey<FormInterface>, value[i]));
          } else {
            const control = new FormControl(value[i]);
            patchFormControl((this.formGroup as unknown) as SubFormGroup<any>, control);
            formArray.insert(i, control);
          }
        }
      }
    });
  }

  private formIsFormWithArrayControls(): this is NgxFormWithArrayControls<FormInterface> {
    return typeof ((this as unknown) as NgxFormWithArrayControls<FormInterface>).createFormArrayControl === 'function';
  }

  // when customizing the emission rate of your sub form component, remember not to **mutate** the stream
  // it is safe to throttle, debounce, delay, etc but using skip, first, last or mutating data inside
  // the stream will cause issues!
  public handleEmissionRate(): (obs$: Observable<ControlInterface | null>) => Observable<ControlInterface | null> {
    return obs$ => obs$;
  }

  // that method can be overridden if the
  // shape of the form needs to be modified
  protected transformToFormGroup(
    obj: ControlInterface | null,
    defaultValues: Partial<FormInterface> | null,
  ): FormInterface | null {
    return (obj as any) as FormInterface;
  }

  // that method can be overridden if the
  // shape of the form needs to be modified
  protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null {
    return (formValue as any) as ControlInterface;
  }
}

export abstract class NgxSubFormRemapComponent<ControlInterface, FormInterface> extends NgxSubFormComponent<
  ControlInterface,
  FormInterface
> {
  protected abstract transformToFormGroup(
    obj: ControlInterface | null,
    defaultValues: Partial<FormInterface> | null,
  ): FormInterface | null;
  protected abstract transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
}
