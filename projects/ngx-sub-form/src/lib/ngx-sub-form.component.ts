import { AfterContentChecked, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
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

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class NgxSubFormComponent<ControlInterface, FormInterface = ControlInterface>
  implements OnChanges, AfterContentChecked {
  // when developing the lib it's a good idea to set the formGroup type
  // to current + `| undefined` to catch a bunch of possible issues
  // see @note form-group-undefined

  // tslint:disable-next-line: no-input-rename
  @Input('subForm') formGroup!: TypedSubFormGroup<ControlInterface, FormInterface>;

  protected emitNullOnDestroy = true;
  protected emitInitialValueOnInit = true;

  // can't define them directly
  protected abstract getFormControls(): Controls<FormInterface>;

  public get formControlNames(): ControlsNames<FormInterface> {
    // see @note form-group-undefined for as syntax
    return this.mapControls(
      (_, key) => key,
      () => true,
      false,
    ) as ControlsNames<FormInterface>;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataInput'] === undefined && changes['formGroup'] === undefined) {
      return;
    }

    if (!(this.formGroup instanceof SubFormGroup)) {
      throw new Error('The subForm input needs to be of type SubFormGroup.');
    }

    Object.keys(this.formGroup.controls).forEach(key => {
      this.formGroup.removeControl(key);
    });

    const subForm = this.formGroup;

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

    // connect sub form group with current sub-form-component
    subForm.setSubForm(this);

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
    // TODO this runs too often, find out of this can be triggered differently
    // checking if the form group has a change detector (root forms might not)
    if (this.formGroup.cd) {
      // if this is the root form
      // OR if ist a sub form but the root form does not have a change detector
      // we need to actually run change detection vs just marking for check
      if (!this.formGroup.parent) {
        this.formGroup.cd.detectChanges();
      } else {
        this.formGroup.cd.markForCheck();
      }
    }
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
    // TODO check if this can still happen, it appreaded during development. might alerady be fixed
    if (!this.formGroup) {
      return;
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
          if (this.formIsFormWithArrayControls()) {
            formArray.insert(i, this.createFormArrayControl(key as ArrayPropertyKey<FormInterface>, value[i]));
          } else {
            const control = new FormControl(value[i]);
            patchFormControl(this.formGroup, control);
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

@Directive()
// tslint:disable-next-line: directive-class-suffix
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
