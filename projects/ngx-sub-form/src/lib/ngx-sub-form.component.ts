import { Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  AbstractControlOptions,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  ValidationErrors,
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
} from './ngx-sub-form-utils';
import { FormGroupOptions, NgxFormWithArrayControls, TypedFormGroup } from './ngx-sub-form.types';
import { SubFormGroup } from './sub-form-group';

type MapControlFunction<FormInterface, MapValue> = (ctrl: AbstractControl, key: keyof FormInterface) => MapValue;
type FilterControlFunction<FormInterface> = (
  ctrl: AbstractControl,
  key: keyof FormInterface,
  isCtrlWithinFormArray: boolean,
) => boolean;

export abstract class NgxSubFormComponent<ControlInterface, FormInterface = ControlInterface>
  implements OnInit, OnDestroy {
  public get formGroupControls(): ControlsType<FormInterface> {
    // @note form-group-undefined we need the return null here because we do not want to expose the fact that
    // the form can be undefined, it's handled internally to contain an Angular bug
    if (!this.formGroup) {
      return null as any;
    }

    return this.formGroup.controls as ControlsType<FormInterface>;
  }

  public get formGroupValues(): Required<FormInterface> {
    // see @note form-group-undefined for non-null assertion reason
    // tslint:disable-next-line:no-non-null-assertion
    return this.mapControls(ctrl => ctrl.value)!;
  }

  public get formGroupErrors(): FormErrors<FormInterface> {
    const errors: FormErrors<FormInterface> = this.mapControls<ValidationErrors | ValidationErrors[] | null>(
      ctrl => ctrl.errors,
      (ctrl, _, isCtrlWithinFormArray) => (isCtrlWithinFormArray ? true : ctrl.invalid),
      true,
    ) as FormErrors<FormInterface>;

    if (!this.formGroup.errors && (!errors || !Object.keys(errors).length)) {
      return null;
    }

    return Object.assign({}, this.formGroup.errors ? { formGroup: this.formGroup.errors } : {}, errors);
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
  @Input('subForm') formGroup!: TypedFormGroup<FormInterface>;

  protected emitNullOnDestroy = true;
  protected emitInitialValueOnInit = true;

  // can't define them directly
  protected abstract getFormControls(): Controls<FormInterface>;

  ngOnInit() {
    // TODO change type of formGroup to be derived form SubFormGroup / SubFormArray then remove as any
    // connect the sub form component to the SubFormGroup / SubFormArray
    const subForm = (this.formGroup as unknown) as SubFormGroup<ControlInterface, FormInterface>;
    subForm.setSubForm(this);

    const controls = this.getFormControls();
    for (const key in controls) {
      if (controls.hasOwnProperty(key)) {
        const control = controls[key];
        this.formGroup.addControl(key, control);
      }
    }
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

    this.formGroup.reset(transformedValue, { onlySelf: true, emitEvent: false });

    // check if this needs to be called after reset was called
    this.formGroup.updateValueAndValidity({ onlySelf: true, emitEvent: false });
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

    const formControls: Controls<FormInterface> = this.formGroup.controls;

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

  // when getDefaultValues is defined, you do not need to specify the default values
  // in your form (the ones defined within the `getFormControls` method)
  protected getDefaultValues(): Partial<FormInterface> {
    return {};
  }

  public handleFormArrayControls(obj: any) {
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
            formArray.insert(i, new FormControl(value[i]));
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

// public writeValue(obj: Required<ControlInterface> | null): void {
//   // @hack see where defining this.formGroup to undefined
//   if (!this.formGroup) {
//     return;
//   }

//   const defaultValues: Partial<FormInterface> | null = this.getDefaultValues();

//   const transformedValue: FormInterface | null = this.transformToFormGroup(
//     obj === undefined ? null : obj,
//     defaultValues,
//   );

//   if (isNullOrUndefined(transformedValue)) {
//     this.formGroup.reset(
//       // calling `reset` on a form with `null` throws an error but if nothing is passed
//       // (undefined) it will reset all the form values to null (as expected)
//       defaultValues === null ? undefined : defaultValues,
//       { emitEvent: false },
//     );
//   } else {
//     const missingKeys: (keyof FormInterface)[] = this.getMissingKeys(transformedValue);
//     if (missingKeys.length > 0) {
//       throw new MissingFormControlsError(missingKeys as string[]);
//     }

//     this.handleFormArrayControls(transformedValue);

//     // The next few lines are weird but it's as workaround.
//     // There are some shady behavior with the disabled state
//     // of a form. Apparently, using `setValue` on a disabled
//     // form does re-enable it *sometimes*, not always.
//     // related issues:
//     // https://github.com/angular/angular/issues/31506
//     // https://github.com/angular/angular/issues/22556
//     // but if you display `this.formGroup.disabled`
//     // before and after the `setValue` is called, it's the same
//     // result which is even weirder
//     const fgDisabled: boolean = this.formGroup.disabled;

//     this.formGroup.setValue(transformedValue, {
//       emitEvent: false,
//     });

//     if (fgDisabled) {
//       this.formGroup.disable();
//     }
//   }

//   this.formGroup.markAsPristine();
//   this.formGroup.markAsUntouched();
// }

// public registerOnChange(fn: (_: any) => void): void {
//   if (!this.formGroup) {
//     return;
//   }

//   this.onChange = fn;

//   interface KeyValueForm {
//     key: keyof FormInterface;
//     value: unknown;
//   }

//   const formControlNames: (keyof FormInterface)[] = Object.keys(this.formControlNames) as (keyof FormInterface)[];

//   const formValues: Observable<KeyValueForm>[] = formControlNames.map(key =>
//     this.formGroup.controls[key].valueChanges.pipe(
//       startWith(this.formGroup.controls[key].value),
//       map(value => ({ key, value })),
//     ),
//   );

//   const lastKeyEmitted$: Observable<keyof FormInterface> = merge(...formValues.map(obs => obs.pipe(map(x => x.key))));

//   this.subscription = this.formGroup.valueChanges
//     .pipe(
//       // hook to give access to the observable for sub-classes
//       // this allow sub-classes (for example) to debounce, throttle, etc
//       this.handleEmissionRate(),
//       startWith(this.formGroup.value),
//       // this is required otherwise an `ExpressionChangedAfterItHasBeenCheckedError` will happen
//       // this is due to the fact that parent component will define a given state for the form that might
//       // be changed once the children are being initialized
//       delay(0),
//       filter(() => !!this.formGroup),
//       // detect which stream emitted last
//       withLatestFrom(lastKeyEmitted$),
//       map(([_, keyLastEmit], index) => {
//         if (index > 0 && this.onTouched) {
//           this.onTouched();
//         }

//         if (index > 0 || (index === 0 && this.emitInitialValueOnInit)) {
//           if (this.onChange) {
//             this.onChange(
//               this.transformFromFormGroup(
//                 // do not use the changes passed by `this.formGroup.valueChanges` here
//                 // as we've got a delay(0) above, on the next tick the form data might
//                 // be outdated and might result into an inconsistent state where a form
//                 // state is valid (base on latest value) but the previous value
//                 // (the one passed by `this.formGroup.valueChanges` would be the previous one)
//                 this.formGroup.value,
//               ),
//             );
//           }

//           const formUpdate: FormUpdate<FormInterface> = {};
//           formUpdate[keyLastEmit] = true;
//           this.onFormUpdate(formUpdate);
//         }
//       }),
//     )
//     .subscribe();
// }
