import { ControlValueAccessor, ValidationErrors, FormControl, FormArray, AbstractControl, FormGroup } from '@angular/forms';
import { InjectionToken, Type, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
export declare type Controls<T> = {
    [K in keyof T]-?: AbstractControl;
};
export declare type ControlsNames<T> = {
    [K in keyof T]-?: K;
};
export declare type ControlMap<T, V> = {
    [K in keyof T]-?: V;
};
export declare type ControlsType<T> = {
    [K in keyof T]-?: T[K] extends any[] ? TypedFormArray<T[K]> : TypedFormControl<T[K]> | TypedFormGroup<T[K]>;
};
export declare type FormErrorsType<T> = {
    [K in keyof T]-?: T[K] extends any[] ? (null | ValidationErrors)[] : ValidationErrors;
};
export declare type FormUpdate<FormInterface> = {
    [FormControlInterface in keyof FormInterface]?: true;
};
export declare type FormErrors<FormInterface> = null | Partial<FormErrorsType<FormInterface> & {
    formGroup?: ValidationErrors;
}>;
export interface TypedAbstractControl<TValue> extends AbstractControl {
    value: TValue;
    valueChanges: Observable<TValue>;
    setValue(value: TValue, options?: Parameters<AbstractControl['setValue']>[1]): void;
    patchValue(value: Partial<TValue>, options?: Parameters<AbstractControl['patchValue']>[1]): void;
}
export interface TypedFormGroup<TValue> extends FormGroup {
    value: TValue;
    valueChanges: Observable<TValue>;
    controls: ControlsType<TValue>;
    setValue(value: TValue, options?: Parameters<FormGroup['setValue']>[1]): void;
    patchValue(value: Partial<TValue>, options?: Parameters<FormGroup['patchValue']>[1]): void;
    getRawValue(): TValue;
}
export interface TypedFormArray<TValue extends any[]> extends FormArray {
    value: TValue;
    valueChanges: Observable<TValue>;
    controls: TypedAbstractControl<TValue>[];
    setValue(value: TValue, options?: Parameters<FormArray['setValue']>[1]): void;
    patchValue(value: TValue, options?: Parameters<FormArray['patchValue']>[1]): void;
    getRawValue(): TValue;
}
export interface TypedFormControl<TValue> extends FormGroup {
    value: TValue;
    valueChanges: Observable<TValue>;
    setValue(value: TValue, options?: Parameters<FormControl['setValue']>[1]): void;
    patchValue(value: Partial<TValue>, options?: Parameters<FormControl['patchValue']>[1]): void;
}
export declare type KeysWithType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
export declare type ArrayPropertyKey<T> = KeysWithType<T, Array<any>>;
export declare type ArrayPropertyValue<T, K extends ArrayPropertyKey<T> = ArrayPropertyKey<T>> = T[K] extends Array<infer U> ? U : never;
export declare function subformComponentProviders(component: any): {
    provide: InjectionToken<ControlValueAccessor>;
    useExisting: Type<any>;
    multi?: boolean;
}[];
export declare class MissingFormControlsError<T extends string> extends Error {
    constructor(missingFormControls: T[]);
}
export declare const NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES: {
    debounce: <T, U>(time: number) => (obs$: Observable<U>) => Observable<U>;
};
/**
 * Easily unsubscribe from an observable stream by appending `takeUntilDestroyed(this)` to the observable pipe.
 * If the component already has a `ngOnDestroy` method defined, it will call this first.
 * Note that the component *must* implement OnDestroy for this to work (the typings will enforce this anyway)
 */
export declare function takeUntilDestroyed<T>(component: OnDestroy): (source: Observable<T>) => Observable<T>;
