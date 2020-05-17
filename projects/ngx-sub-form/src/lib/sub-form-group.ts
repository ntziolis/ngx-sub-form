import { AbstractControlOptions, AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';

import { NgxSubFormComponent } from './ngx-sub-form.component';

export class SubFormGroup<TControl, TForm = TControl> extends FormGroup {
  private subForm!: NgxSubFormComponent<TControl, TForm>;

  private initalValue!: Partial<TControl>;
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  public readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
  public readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;

  constructor(
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
  ) {
    // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
    super({});

    this.parentValidatorOrOpts = validatorOrOpts;
    this.parentAsyncValidator = asyncValidator;
  }

  setSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;

    // transform to form group should never return null / undefined but {} instead
    this.transformToFormGroup = (obj: TControl | null, defaultValues: Partial<TForm>) => {
      return this.subForm['transformToFormGroup'](obj, defaultValues) || ({} as TForm);
    };

    this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
    this.getDefaultValues = this.subForm['getDefaultValues'];

    // this value is set when the a value was passed into a root form
    if (this.initalValue) {
      this.reset(this.initalValue, { onlySelf: true, emitEvent: false });
    }
  }

  getRawValue(): any {
    const rawValue = super.getRawValue();
    return this.transformFromFormGroup(rawValue);
  }

  setValue(value: TControl, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    const transformedValue = (this.transformToFormGroup(value, this.getDefaultValues()) as unknown) as TControl;

    // TODO figure out how to handle for arrays
    // this.subForm.handleFormArrayControls(transformedValue);

    super.setValue(transformedValue, options);
  }

  patchValue(value: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // this happens when the parent sets a value but the sub-form-component has not tun ngOnInit yet
    if (!this.transformToFormGroup) {
      if (value) {
        this.initalValue = value;
      }

      return;
    }

    // TODO check if providing {} does work, as we do not want to override existing values with default values
    // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
    // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined

    const transformedValue = (this.transformToFormGroup(
      (value as unknown) as TControl,

      {},
    ) as unknown) as TControl;

    // TODO figure out how to handle for arrays
    // this.subForm.handleFormArrayControls(transformedValue);

    super.patchValue(transformedValue, options);
  }

  reset(value: Partial<TControl> = {}, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // reset is triggered from parent when formgroup is created
    // then again from sub-form inside ngOnInit after subForm was set
    // so when can safely ignore resets prior to subForm being set
    if (!this.subForm) {
      return;
    }

    const transformedValue = (this.transformToFormGroup(
      (value as unknown) as TControl,
      this.getDefaultValues(),
    ) as unknown) as TControl;

    // TODO figure out how to handle for arrays
    //this.subForm.handleFormArrayControls(transformedValue);

    super.reset(transformedValue, options);
  }
}
