import { ChangeDetectorRef } from '@angular/core';
import { AbstractControlOptions, AsyncValidatorFn, FormGroup, ValidatorFn, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { NgxSubFormComponent } from './ngx-sub-form.component';
export declare class SubFormGroup<TControl, TForm = TControl> extends FormGroup {
    private subForm;
    cd: ChangeDetectorRef | undefined;
    private isRoot;
    private _valueChanges;
    controlValue: TControl;
    private transformToFormGroup;
    private transformFromFormGroup;
    private getDefaultValues;
    readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
    readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;
    constructor(value: Partial<TControl> | null, validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null);
    setChangeDetector(cd: ChangeDetectorRef): void;
    get value(): any;
    set value(value: any);
    setSubForm(subForm: NgxSubFormComponent<TControl, TForm>): void;
    getRawValue(): any;
    setValue(value: TControl, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    patchValue(value: Partial<TControl>, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    reset(value?: Partial<TControl>, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    private getControlValue;
    updateValue(options: any): void;
}
export declare function patchFormControl<TControl, TForm>(subFormGroup: SubFormGroup<TControl, TForm>, control: FormControl): void;
export declare class SubFormArray<TControl, TForm = TControl> extends FormArray {
    private subForm;
    private isRoot;
    private _valueChanges;
    private transformToFormGroup;
    private transformFromFormGroup;
    private getDefaultValues;
    readonly parentValidatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null | undefined;
    readonly parentAsyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null | undefined;
    constructor(subForm: NgxSubFormComponent<TControl, TForm>, controls: AbstractControl[], validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null);
    setSubForm(subForm: NgxSubFormComponent<TControl, TForm>): void;
    setValue(value: any, options: any): void;
    patchValue(value: any, options: any): void;
    updateValue(options: any): void;
    removeAt(index: number): void;
}
