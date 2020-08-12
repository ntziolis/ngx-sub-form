import { OnDestroy } from '@angular/core';
import { ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { Observable } from 'rxjs';
import { Controls, ControlsNames, FormUpdate, FormErrors, ControlsType, TypedFormGroup } from './ngx-sub-form-utils';
import { FormGroupOptions, OnFormUpdate } from './ngx-sub-form.types';
export declare abstract class NgxSubFormComponent<ControlInterface, FormInterface = ControlInterface> implements ControlValueAccessor, Validator, OnDestroy, OnFormUpdate<FormInterface> {
    get formGroupControls(): ControlsType<FormInterface>;
    get formGroupValues(): Required<FormInterface>;
    get formGroupErrors(): FormErrors<FormInterface>;
    get formControlNames(): ControlsNames<FormInterface>;
    private controlKeys;
    formGroup: TypedFormGroup<FormInterface>;
    protected onChange: Function | undefined;
    protected onTouched: Function | undefined;
    protected emitNullOnDestroy: boolean;
    protected emitInitialValueOnInit: boolean;
    private subscription;
    private controlDisabled;
    constructor();
    protected abstract getFormControls(): Controls<FormInterface>;
    private _getFormControls;
    private mapControls;
    onFormUpdate(formUpdate: FormUpdate<FormInterface>): void;
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    protected getFormGroupControlOptions(): FormGroupOptions<FormInterface>;
    validate(): ValidationErrors | null;
    ngOnDestroy(): void;
    protected getDefaultValues(): Partial<FormInterface> | null;
    writeValue(obj: Required<ControlInterface> | null): void;
    private handleFormArrayControls;
    private formIsFormWithArrayControls;
    private getMissingKeys;
    protected handleEmissionRate(): (obs$: Observable<FormInterface>) => Observable<FormInterface>;
    protected transformToFormGroup(obj: ControlInterface | null, defaultValues: Partial<FormInterface> | null): FormInterface | null;
    protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
    registerOnChange(fn: (_: any) => void): void;
    registerOnTouched(fn: any): void;
    setDisabledState(shouldDisable: boolean | undefined): void;
}
export declare abstract class NgxSubFormRemapComponent<ControlInterface, FormInterface> extends NgxSubFormComponent<ControlInterface, FormInterface> {
    protected abstract transformToFormGroup(obj: ControlInterface | null, defaultValues: Partial<FormInterface> | null): FormInterface | null;
    protected abstract transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
}
