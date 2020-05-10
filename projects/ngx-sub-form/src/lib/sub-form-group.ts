import { AbstractControlOptions, AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';
import { map } from 'rxjs/operators';

import { NgxSubFormComponent } from './ngx-sub-form.component';
import { Observable } from 'rxjs';

export class SubFormGroup<TControl, TForm = TControl> extends FormGroup {
  private subForm!: NgxSubFormComponent<TControl, TForm>;
  private transformToFormGroup!: NgxSubFormComponent<TControl, TForm>['transformToFormGroup'];
  private transformFromFormGroup!: NgxSubFormComponent<TControl, TForm>['transformFromFormGroup'];
  private getDefaultValues!: NgxSubFormComponent<TControl, TForm>['getDefaultValues'];

  // fields we have to reimplement since super cannot be used
  private _valueChanges!: Observable<any>;
  private _value: any;

  constructor(
    validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
  ) {
    super({}, validatorOrOpts, asyncValidator);
  }

  initSubForm(subForm: NgxSubFormComponent<TControl, TForm>) {
    this.subForm = subForm;
    this.transformToFormGroup = this.subForm['transformToFormGroup'];
    this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
    this.getDefaultValues = this.subForm['getDefaultValues'];
  }

  get valueChanges() {
    return this._valueChanges.pipe(map(value => this.transformFromFormGroup(value)));
  }
  set valueChanges(value) {
    this._valueChanges = value;
  }

  get value() {
    return this.transformFromFormGroup(this._value);
  }
  set value(value) {
    this._value = value;
  }

  getRawValue(): any {
    const rawValue = super.getRawValue();
    return this.transformFromFormGroup(rawValue);
  }

  setValue(value: TControl, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    super.setValue((this.transformToFormGroup(value, this.getDefaultValues()) as unknown) as TControl, options);
  }

  patchValue(value: Partial<TControl>, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    super.patchValue(
      (this.transformToFormGroup((value as unknown) as TControl, this.getDefaultValues()) as unknown) as TControl,
      options,
    );
  }

  reset(value: Partial<TControl> = {}, options: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    super.reset(this.transformToFormGroup((value as unknown) as TControl, this.getDefaultValues()), options);
  }
}
