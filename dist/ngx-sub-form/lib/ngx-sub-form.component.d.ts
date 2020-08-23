import { AfterContentChecked, OnChanges, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Controls, ControlsNames } from './ngx-sub-form-utils';
import { FormGroupOptions, TypedSubFormGroup } from './ngx-sub-form.types';
export declare abstract class NgxSubFormComponent<ControlInterface, FormInterface = ControlInterface> implements OnChanges, AfterContentChecked {
    formGroup: TypedSubFormGroup<ControlInterface, FormInterface>;
    protected emitNullOnDestroy: boolean;
    protected emitInitialValueOnInit: boolean;
    protected abstract getFormControls(): Controls<FormInterface>;
    get formControlNames(): ControlsNames<FormInterface>;
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterContentChecked(): void;
    protected _initializeFormGroup(dataInputHasChanged?: boolean): void;
    private mapControls;
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    protected getFormGroupControlOptions(): FormGroupOptions<FormInterface>;
    protected getDefaultValues(): Partial<FormInterface>;
    handleFormArrayControls(obj: any): void;
    private formIsFormWithArrayControls;
    handleEmissionRate(): (obs$: Observable<ControlInterface | null>) => Observable<ControlInterface | null>;
    protected transformToFormGroup(obj: ControlInterface | null, fallbackValue: Partial<FormInterface> | null): FormInterface | null;
    protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
}
export declare abstract class NgxSubFormRemapComponent<ControlInterface, FormInterface> extends NgxSubFormComponent<ControlInterface, FormInterface> {
    protected abstract transformToFormGroup(obj: ControlInterface | null, fallbackValue: Partial<FormInterface> | null): FormInterface | null;
    protected abstract transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
}
