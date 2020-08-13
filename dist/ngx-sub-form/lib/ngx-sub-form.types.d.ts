import { FormControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { ArrayPropertyKey, ArrayPropertyValue, ControlsType, FormUpdate, TypedFormGroup } from './ngx-sub-form-utils';
import { SubFormGroup } from './sub-form-group';
export interface OnFormUpdate<FormInterface> {
    onFormUpdate?: (formUpdate: FormUpdate<FormInterface>) => void;
}
declare type Nullable<T> = T | null;
export declare type NullableObject<T> = {
    [P in keyof T]: Nullable<T[P]>;
};
export declare type TypedValidatorFn<T> = (formGroup: TypedFormGroup<T>) => ValidationErrors | null;
export declare type TypedAsyncValidatorFn<T> = (formGroup: TypedFormGroup<T>) => Promise<ValidationErrors | null> | Observable<ValidationErrors | null>;
export interface FormGroupOptions<T> {
    /**
     * @description
     * The list of validators applied to a control.
     */
    validators?: TypedValidatorFn<T> | TypedValidatorFn<T>[] | null;
    /**
     * @description
     * The list of async validators applied to control.
     */
    asyncValidators?: TypedAsyncValidatorFn<T> | TypedAsyncValidatorFn<T>[] | null;
    /**
     * @description
     * The event name for control to update upon.
     */
    updateOn?: 'change' | 'blur' | 'submit';
}
export interface NgxFormWithArrayControls<T> {
    createFormArrayControl(key: ArrayPropertyKey<T>, value: ArrayPropertyValue<T>): FormControl;
}
export interface TypedSubFormGroup<TControl, TForm = TControl> extends SubFormGroup<TControl, TForm> {
    controls: ControlsType<TForm>;
    valueChanges: Observable<TControl>;
}
export {};
