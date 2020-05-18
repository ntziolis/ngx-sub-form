import { EventEmitter } from '@angular/core';
import { AbstractControlOptions, AsyncValidatorFn, FormGroup, ValidatorFn, FormControl } from '@angular/forms';

import { NgxSubFormComponent } from './ngx-sub-form.component';

class CustomerEventEmitter<TControl, TForm = TControl> extends EventEmitter<TControl> {
  private subForm!: NgxSubFormComponent<TControl, TForm>;
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  setSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;

    this.transformToFormGroup = (obj: TControl | null, defaultValues: Partial<TForm>) => {
      return this.subForm['transformToFormGroup'](obj, defaultValues) || ({} as TForm);
    };
    this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
    this.getDefaultValues = this.subForm['getDefaultValues'];
  }

  emit(value?: TControl): void {
    // all those would happen while the sub-form tree is still being initalized
    // we can safely ignore all emits until subForm is set
    // since in ngOnInit of sub-form-component base class we call reset with the intial values
    if (!this.subForm) {
      return;
    }

    const transformedValue = (this.transformToFormGroup((value as any) as TControl | null, {}) as unknown) as TControl;

    // TODO figure out how to handle for arrays
    // this.subForm.handleFormArrayControls(transformedValue);

    return super.emit(transformedValue);
  }
}

export class SubFormGroup<TControl, TForm = TControl> extends FormGroup {
  private subForm!: NgxSubFormComponent<TControl, TForm>;

  private _valueChanges: CustomerEventEmitter<TControl, TForm>;
  public initalValue!: Partial<TControl>;
  public controlValue!: TControl;
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  public readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
  public readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;

  constructor(
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
    //@Optional() @Inject(SUB_FORM_COMPONENT_TOKEN) public parentSubForm?: NgxSubFormComponent<any>,
  ) {
    // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
    super({});

    this._valueChanges = new CustomerEventEmitter();

    (this.valueChanges as any) = this._valueChanges;

    this.parentValidatorOrOpts = validatorOrOpts;
    this.parentAsyncValidator = asyncValidator;
  }

  get value() {
    // if (!this.subForm) {
    //   return null;
    // }

    // const transformedValue = (this.transformFromFormGroup(
    //   (super.value as any) as TForm,
    // ) as unknown) as TControl;
    // return transformedValue;

    return this.controlValue;
  }

  set value(value: any) {
    if (!this.subForm) {
      return;
    }

    const transformedValue = (this.transformToFormGroup(
      (value as unknown) as TControl,
      {},
    ) as unknown) as TForm;

    (super.value as any) = transformedValue;

    this.controlValue = value;
  }

  setSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;
    this._valueChanges.setSubForm(subForm);

    // transform to form group should never return null / undefined but {} instead
    this.transformToFormGroup = (obj: TControl | null, defaultValues: Partial<TForm>) => {
      return this.subForm['transformToFormGroup'](obj, defaultValues) || ({} as TForm);
    };
    this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
    this.getDefaultValues = this.subForm['getDefaultValues'];
  }

  getRawValue(): any {
    const rawValue = super.getRawValue();
    return this.transformFromFormGroup(rawValue);
  }

  // setValue(value: TControl, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
  //   if (!this.subForm) {
  //     if (value) {
  //       this.initalValue = value;
  //     }
  //     return;
  //   }

  //   const transformedValue = (this.transformToFormGroup(value, this.getDefaultValues()) as unknown) as TControl;

  //   // TODO figure out how to handle for arrays
  //   // this.subForm.handleFormArrayControls(transformedValue);

  //   super.setValue(transformedValue, options);
  // }

  // patchValue(value: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
  //   // this happens when the parent sets a value but the sub-form-component has not tun ngOnInit yet
  //   if (!this.subForm) {
  //       this.initalValue = value;
  //       return;
  //   }

  //   super.patchValue(value)
  // }

  patchValue(value: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // this happens when the parent sets a value but the sub-form-component has not tun ngOnInit yet
    if (!this.subForm) {
      if (value) {
        this.initalValue = value;
      }
      return;
    }

    this.controlValue = { ...this.controlValue, ...value };

    // TODO check if providing {} does work, as we do not want to override existing values with default values
    // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
    // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
    const transformedValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;

    // TODO figure out how to handle for arrays
    // this.subForm.handleFormArrayControls(transformedValue);

    super.patchValue(transformedValue, options);

    // const controlValue = (this.transformFromFormGroup(
    //   (value as unknown) as TForm,
    // ) as unknown) as TControl;

    // this.controlValue = controlValue;
  }

  reset(value: Partial<TControl> = {}, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // reset is triggered from parent when formgroup is created
    // then again from sub-form inside ngOnInit after subForm was set
    // so when can safely ignore resets prior to subForm being set
    if (!this.subForm) {
      if (value) {
        this.initalValue = value;
      }
      return;
    }

    this.controlValue = { ...this.controlValue, ...value };

    const formValue = (this.transformToFormGroup(
      (value as unknown) as TControl,
      this.getDefaultValues(),
    ) as unknown) as TForm;

    // TODO figure out how to handle for arrays
    //this.subForm.handleFormArrayControls(transformedValue);

    super.reset(formValue, options);

    // const controlValue = (this.transformFromFormGroup((value as unknown) as TForm) as unknown) as TControl;
  }
}
