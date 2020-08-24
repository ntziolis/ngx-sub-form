import { EventEmitter, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControlOptions,
  AsyncValidatorFn,
  FormGroup,
  ValidatorFn,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';

import { NgxSubFormComponent } from './ngx-sub-form.component';

class CustomEventEmitter<TControl, TForm = TControl> extends EventEmitter<TControl> {
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

  public cd: ChangeDetectorRef | undefined;
  private isRoot = false;
  private _valueChanges: CustomEventEmitter<TControl, TForm>;
  public controlValue!: TControl;
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  public readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
  public readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;

  constructor(
    value: Partial<TControl> | null,
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
    //@Optional() @Inject(SUB_FORM_COMPONENT_TOKEN) public parentSubForm?: NgxSubFormComponent<any>,
  ) {
    // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
    super({});

    // this is how to overwrite a propetotype property
    //   Object.defineProperty(foo, "bar", {
    //     // only returns odd die sides
    //     get: function () { return (Math.random() * 6) | 1; }
    // });

    this.controlValue = (value || undefined) as TControl;

    this._valueChanges = new CustomEventEmitter();

    (this.valueChanges as any) = this._valueChanges;

    this.parentValidatorOrOpts = validatorOrOpts;
    this.parentAsyncValidator = asyncValidator;
  }

  setChangeDetector(cd: ChangeDetectorRef) {
    this.cd = cd;
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

    const formValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;

    // TODO rethink as this might not work as we want it, we might not even need this anymore
    // @ts-ignore
    (super.value as any) = formValue;

    this.controlValue = value;
  }

  setSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;
    this._valueChanges.setSubForm(subForm);

    if (this.root === this) {
      this.isRoot = true;
    }

    // transform to form group should never return null / undefined but {} instead
    this.transformToFormGroup = (obj: TControl | null, defaultValues: Partial<TForm>) => {
      return this.subForm['transformToFormGroup'](obj, defaultValues) || ({} as TForm);
    };
    this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
    this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
  }

  getRawValue(): TControl {
    const rawValue = super.getRawValue();
    return this.transformFromFormGroup(rawValue) as TControl;
  }

  setValue(value: TControl, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // this happens when the parent sets a value but the sub-form-component has not run ngChanges yet
    if (!this.subForm) {
      if (value) {
        this.controlValue = value;
      }
      return;
    }

    this.controlValue = value;

    // TODO check if providing {} does work, as we do not want to override existing values with default values
    // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
    // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
    const formValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;

    // TODO figure out how to handle for arrays
    this.subForm.handleFormArrayControls(formValue);

    super.patchValue(formValue, options);
  }

  patchValue(value: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // this happens when the parent sets a value but the sub-form-component has not tun ngOnInit yet
    if (!this.subForm) {
      if (value) {
        this.controlValue = value as TControl;
      }
      return;
    }

    this.controlValue = { ...this.controlValue, ...value };

    // TODO check if providing {} does work, as we do not want to override existing values with default values
    // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
    // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
    const formValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;

    // TODO figure out how to handle for arrays
    this.subForm.handleFormArrayControls(formValue);

    super.patchValue(formValue, options);
  }

  reset(value?: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    // reset is triggered from parent when formgroup is created
    // then again from sub-form inside ngOnInit after subForm was set
    // so when can safely ignore resets prior to subForm being set
    if (!this.subForm) {
      if (value) {
        this.controlValue = value as TControl;
      }
      return;
    }

    const defaultValues = this.getDefaultValues() as TForm;
    // if value is an array skip merging with default values
    if (Array.isArray(value)) {
      this.controlValue = (value as unknown) as TControl;
    } else {
      this.controlValue = { ...this.transformFromFormGroup(defaultValues), value } as TControl;
    }

    const formValue = (this.transformToFormGroup(this.controlValue, defaultValues) as unknown) as TForm;

    // TODO figure out how to handle for arrays
    this.subForm.handleFormArrayControls(formValue);

    super.reset(formValue, options);
  }

  private getControlValue(control: AbstractControl): any {
    if (control instanceof SubFormGroup) {
      return control.controlValue;
    } else if (control instanceof SubFormArray) {
      return control.controls.map(arrayElementControl => this.getControlValue(arrayElementControl));
    } else {
      return control.value;
    }
  }

  updateValue(options: any) {
    if (!this.subForm) {
      return;
    }

    const formValue = {} as any;
    for (const [key, value] of Object.entries(this.subForm.formGroup.controls)) {
      const control = value as AbstractControl;
      formValue[key] = this.getControlValue(control);
    }

    const controlValue = (this.transformFromFormGroup(formValue || ({} as TForm)) as unknown) as TControl;

    this.controlValue = controlValue;

    if (this.isRoot) {
      return;
    }

    const parent = this.parent as SubFormGroup<any, any> | SubFormArray<any, any>;
    parent.updateValue(options);
    //this.updateValueAndValidity(options);
  }
}

// this idea of this is that when a non sub form group is being updated the sub form group needs to be notifed
export function patchFormControl<TControl, TForm>(subFormGroup: SubFormGroup<TControl, TForm>, control: FormControl) {
  const patchableControl = control as FormControl & { isPatched: boolean };

  if (!patchableControl.isPatched) {
    const setValue = patchableControl.setValue.bind(patchableControl);
    patchableControl.setValue = (value: any, options: any) => {
      setValue(value, options);
      subFormGroup.updateValue(options);
    };
    patchableControl.isPatched = true;
  }
}

export class SubFormArray<TControl, TForm = TControl> extends FormArray {
  private subForm!: NgxSubFormComponent<TControl, TForm>;

  private isRoot = false;
  private _valueChanges: CustomEventEmitter<TControl, TForm>;
  //public controlValue!: TControl[];
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  public readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
  public readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;

  constructor(
    subForm: NgxSubFormComponent<TControl, TForm>,
    controls: AbstractControl[],
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
  ) {
    // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
    super(controls);

    this._valueChanges = new CustomEventEmitter();
    (this.valueChanges as any) = this._valueChanges;

    this.parentValidatorOrOpts = validatorOrOpts;
    this.parentAsyncValidator = asyncValidator;

    this.setSubForm(subForm);
  }

  setSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;
    this._valueChanges.setSubForm(subForm);

    // for some reason root is not properly set for form array
    // on the other hand form array should never be root anyway so we can ignore thsi for now
    // if (this.root === this) {
    //   this.isRoot = true;
    // }

    // transform to form group should never return null / undefined but {} instead
    this.transformToFormGroup = (obj: TControl | null, defaultValues: Partial<TForm>) => {
      return this.subForm['transformToFormGroup'](obj, defaultValues) || ({} as TForm);
    };
    this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
    this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
  }

  setValue(value: any, options: any) {
    super.setValue(value, options);
    ((this.subForm.formGroup as unknown) as SubFormGroup<any>).updateValue(options);
  }

  patchValue(value: any, options: any) {
    super.patchValue(value, options);
    ((this.subForm.formGroup as unknown) as SubFormGroup<any>).updateValue(options);
  }

  updateValue(options: any) {
    if (!this.subForm) {
      return;
    }

    (this.parent as any).updateValue(options);
    //this.updateValueAndValidity(options);
  }

  removeAt(index: number): void {
    super.removeAt(index);
    ((this.subForm.formGroup as unknown) as SubFormGroup<any>).updateValue(undefined);
  }
}
