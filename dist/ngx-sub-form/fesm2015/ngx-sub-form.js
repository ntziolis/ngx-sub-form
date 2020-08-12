import { NG_VALUE_ACCESSOR, NG_VALIDATORS, FormGroup, FormArray, FormControl } from '@angular/forms';
import { InjectionToken, forwardRef, Directive, Input } from '@angular/core';
import { timer, Subject, merge, BehaviorSubject } from 'rxjs';
import { debounce, takeUntil, startWith, map, delay, filter, withLatestFrom, tap } from 'rxjs/operators';
import { __decorate, __metadata } from 'tslib';
import isEqual from 'fast-deep-equal';

// ----------------------------------------------------------------------------------------
// no need to expose that token out of the lib, do not export that file from public_api.ts!
// ----------------------------------------------------------------------------------------
// see https://github.com/angular/angular/issues/8277#issuecomment-263029485
// this basically allows us to access the host component
// from a directive without knowing the type of the component at run time
const SUB_FORM_COMPONENT_TOKEN = new InjectionToken('NgxSubFormComponentToken');

function subformComponentProviders(component) {
    return [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => component),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => component),
            multi: true,
        },
        {
            provide: SUB_FORM_COMPONENT_TOKEN,
            useExisting: forwardRef(() => component),
        },
    ];
}
const wrapAsQuote = (str) => `"${str}"`;
const ɵ0 = wrapAsQuote;
class MissingFormControlsError extends Error {
    constructor(missingFormControls) {
        super(`Attempt to update the form value with an object that doesn't contains some of the required form control keys.\nMissing: ${missingFormControls
            .map(wrapAsQuote)
            .join(`, `)}`);
    }
}
const ɵ1 = (time) => obs => obs.pipe(debounce(() => timer(time)));
const NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES = {
    debounce: ɵ1,
};
/**
 * Easily unsubscribe from an observable stream by appending `takeUntilDestroyed(this)` to the observable pipe.
 * If the component already has a `ngOnDestroy` method defined, it will call this first.
 * Note that the component *must* implement OnDestroy for this to work (the typings will enforce this anyway)
 */
function takeUntilDestroyed(component) {
    return (source) => {
        const onDestroy = new Subject();
        const previousOnDestroy = component.ngOnDestroy;
        component.ngOnDestroy = () => {
            if (previousOnDestroy) {
                previousOnDestroy.apply(component);
            }
            onDestroy.next();
            onDestroy.complete();
        };
        return source.pipe(takeUntil(onDestroy));
    };
}
/** @internal */
function isNullOrUndefined(obj) {
    return obj === null || obj === undefined;
}

let NgxSubFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormComponent {
    constructor() {
        this.controlKeys = [];
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.formGroup = new FormGroup(this._getFormControls(), this.getFormGroupControlOptions());
        this.onChange = undefined;
        this.onTouched = undefined;
        this.emitNullOnDestroy = true;
        this.emitInitialValueOnInit = true;
        this.subscription = undefined;
        // a RootFormComponent with the disabled property set initially to `false`
        // will call `setDisabledState` *before* the form is actually available
        // and it wouldn't be disabled once available, therefore we use this flag
        // to check when the FormGroup is created if we should disable it
        this.controlDisabled = false;
        // if the form has default values, they should be applied straight away
        const defaultValues = this.getDefaultValues();
        if (!!defaultValues) {
            this.formGroup.reset(defaultValues, { emitEvent: false });
        }
        // `setTimeout` and `updateValueAndValidity` are both required here
        // indeed, if you check the demo you'll notice that without it, if
        // you select `Droid` and `Assassin` for example the displayed errors
        // are not yet defined for the field `assassinDroid`
        // (until you change one of the value in that form)
        setTimeout(() => {
            if (this.formGroup) {
                this.formGroup.updateValueAndValidity({ emitEvent: false });
                if (this.controlDisabled) {
                    this.formGroup.disable();
                }
            }
        }, 0);
    }
    get formGroupControls() {
        // @note form-group-undefined we need the return null here because we do not want to expose the fact that
        // the form can be undefined, it's handled internally to contain an Angular bug
        if (!this.formGroup) {
            return null;
        }
        return this.formGroup.controls;
    }
    get formGroupValues() {
        // see @note form-group-undefined for non-null assertion reason
        // tslint:disable-next-line:no-non-null-assertion
        return this.mapControls(ctrl => ctrl.value);
    }
    get formGroupErrors() {
        const errors = this.mapControls(ctrl => ctrl.errors, (ctrl, _, isCtrlWithinFormArray) => (isCtrlWithinFormArray ? true : ctrl.invalid), true);
        if (!this.formGroup.errors && (!errors || !Object.keys(errors).length)) {
            return null;
        }
        return Object.assign({}, this.formGroup.errors ? { formGroup: this.formGroup.errors } : {}, errors);
    }
    get formControlNames() {
        // see @note form-group-undefined for as syntax
        return this.mapControls((_, key) => key, () => true, false);
    }
    _getFormControls() {
        const controls = this.getFormControls();
        this.controlKeys = Object.keys(controls);
        return controls;
    }
    mapControls(mapControl, filterControl = () => true, recursiveIfArray = true) {
        if (!this.formGroup) {
            return null;
        }
        const formControls = this.formGroup.controls;
        const controls = {};
        for (const key in formControls) {
            if (this.formGroup.controls.hasOwnProperty(key)) {
                const control = formControls[key];
                if (recursiveIfArray && control instanceof FormArray) {
                    const values = [];
                    for (let i = 0; i < control.length; i++) {
                        if (filterControl(control.at(i), key, true)) {
                            values.push(mapControl(control.at(i), key));
                        }
                    }
                    if (values.length > 0 && values.some(x => !isNullOrUndefined(x))) {
                        controls[key] = values;
                    }
                }
                else if (control && filterControl(control, key, false)) {
                    controls[key] = mapControl(control, key);
                }
            }
        }
        return controls;
    }
    onFormUpdate(formUpdate) { }
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    getFormGroupControlOptions() {
        return {};
    }
    validate() {
        if (
        // @hack see where defining this.formGroup to undefined
        !this.formGroup ||
            this.formGroup.valid) {
            return null;
        }
        return this.formGroupErrors;
    }
    // @todo could this be removed to avoid an override and just use `takeUntilDestroyed`?
    ngOnDestroy() {
        // @hack there's a memory leak within Angular and those components
        // are not correctly cleaned up which leads to error if a form is defined
        // with validators and then it's been removed, the validator would still fail
        // `as any` if because we do not want to define the formGroup as FormGroup | undefined
        // everything related to undefined is handled internally and shouldn't be exposed to end user
        this.formGroup = undefined;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.emitNullOnDestroy && this.onChange) {
            this.onChange(null);
        }
        this.onChange = undefined;
    }
    // when getDefaultValues is defined, you do not need to specify the default values
    // in your form (the ones defined within the `getFormControls` method)
    getDefaultValues() {
        return null;
    }
    writeValue(obj) {
        // @hack see where defining this.formGroup to undefined
        if (!this.formGroup) {
            return;
        }
        const defaultValues = this.getDefaultValues();
        const transformedValue = this.transformToFormGroup(obj === undefined ? null : obj, defaultValues);
        if (isNullOrUndefined(transformedValue)) {
            this.formGroup.reset(
            // calling `reset` on a form with `null` throws an error but if nothing is passed
            // (undefined) it will reset all the form values to null (as expected)
            defaultValues === null ? undefined : defaultValues, 
            // emit to keep internal and external information about data in of control in sync, when
            // null/undefined was passed into writeValue
            // while internally being replaced with defaultValues
            { emitEvent: isNullOrUndefined(obj) && !isNullOrUndefined(defaultValues) });
        }
        else {
            const missingKeys = this.getMissingKeys(transformedValue);
            if (missingKeys.length > 0) {
                throw new MissingFormControlsError(missingKeys);
            }
            this.handleFormArrayControls(transformedValue);
            // The next few lines are weird but it's as workaround.
            // There are some shady behavior with the disabled state
            // of a form. Apparently, using `setValue` on a disabled
            // form does re-enable it *sometimes*, not always.
            // related issues:
            // https://github.com/angular/angular/issues/31506
            // https://github.com/angular/angular/issues/22556
            // but if you display `this.formGroup.disabled`
            // before and after the `setValue` is called, it's the same
            // result which is even weirder
            const fgDisabled = this.formGroup.disabled;
            this.formGroup.setValue(transformedValue, {
                // emit to keep internal and external information about data in of control in sync, when
                // null/undefined was passed into writeValue
                // while internally being replaced with transformedValue
                emitEvent: isNullOrUndefined(obj),
            });
            if (fgDisabled) {
                this.formGroup.disable();
            }
        }
        this.formGroup.markAsPristine();
        this.formGroup.markAsUntouched();
    }
    handleFormArrayControls(obj) {
        Object.entries(obj).forEach(([key, value]) => {
            if (this.formGroup.get(key) instanceof FormArray && Array.isArray(value)) {
                const formArray = this.formGroup.get(key);
                // instead of creating a new array every time and push a new FormControl
                // we just remove or add what is necessary so that:
                // - it is as efficient as possible and do not create unnecessary FormControl every time
                // - validators are not destroyed/created again and eventually fire again for no reason
                while (formArray.length > value.length) {
                    formArray.removeAt(formArray.length - 1);
                }
                for (let i = formArray.length; i < value.length; i++) {
                    if (this.formIsFormWithArrayControls()) {
                        formArray.insert(i, this.createFormArrayControl(key, value[i]));
                    }
                    else {
                        formArray.insert(i, new FormControl(value[i]));
                    }
                }
            }
        });
    }
    formIsFormWithArrayControls() {
        return typeof this.createFormArrayControl === 'function';
    }
    getMissingKeys(transformedValue) {
        // `controlKeys` can be an empty array, empty forms are allowed
        const missingKeys = this.controlKeys.reduce((keys, key) => {
            if (isNullOrUndefined(transformedValue) || transformedValue[key] === undefined) {
                keys.push(key);
            }
            return keys;
        }, []);
        return missingKeys;
    }
    // when customizing the emission rate of your sub form component, remember not to **mutate** the stream
    // it is safe to throttle, debounce, delay, etc but using skip, first, last or mutating data inside
    // the stream will cause issues!
    handleEmissionRate() {
        return obs$ => obs$;
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformToFormGroup(obj, defaultValues) {
        return obj;
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformFromFormGroup(formValue) {
        return formValue;
    }
    registerOnChange(fn) {
        if (!this.formGroup) {
            return;
        }
        this.onChange = fn;
        const formControlNames = Object.keys(this.formControlNames);
        const formValues = formControlNames.map(key => this.formGroup.controls[key].valueChanges.pipe(startWith(this.formGroup.controls[key].value), map(value => ({ key, value }))));
        const lastKeyEmitted$ = merge(...formValues.map(obs => obs.pipe(map(x => x.key))));
        this.subscription = this.formGroup.valueChanges
            .pipe(
        // hook to give access to the observable for sub-classes
        // this allow sub-classes (for example) to debounce, throttle, etc
        this.handleEmissionRate(), startWith(this.formGroup.value), 
        // this is required otherwise an `ExpressionChangedAfterItHasBeenCheckedError` will happen
        // this is due to the fact that parent component will define a given state for the form that might
        // be changed once the children are being initialized
        delay(0), filter(() => !!this.formGroup), 
        // detect which stream emitted last
        withLatestFrom(lastKeyEmitted$), map(([_, keyLastEmit], index) => {
            if (index > 0 && this.onTouched) {
                this.onTouched();
            }
            if (index > 0 || (index === 0 && this.emitInitialValueOnInit)) {
                if (this.onChange) {
                    this.onChange(this.transformFromFormGroup(
                    // do not use the changes passed by `this.formGroup.valueChanges` here
                    // as we've got a delay(0) above, on the next tick the form data might
                    // be outdated and might result into an inconsistent state where a form
                    // state is valid (base on latest value) but the previous value
                    // (the one passed by `this.formGroup.valueChanges` would be the previous one)
                    this.formGroup.value));
                }
                const formUpdate = {};
                formUpdate[keyLastEmit] = true;
                this.onFormUpdate(formUpdate);
            }
        }))
            .subscribe();
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(shouldDisable) {
        this.controlDisabled = !!shouldDisable;
        if (!this.formGroup) {
            return;
        }
        if (shouldDisable) {
            this.formGroup.disable({ emitEvent: false });
        }
        else {
            this.formGroup.enable({ emitEvent: false });
        }
    }
};
NgxSubFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
    ,
    __metadata("design:paramtypes", [])
], NgxSubFormComponent);
let NgxSubFormRemapComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormRemapComponent extends NgxSubFormComponent {
};
NgxSubFormRemapComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormRemapComponent);

let NgxRootFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxRootFormComponent extends NgxSubFormRemapComponent {
    constructor() {
        super(...arguments);
        // `Input` values are set while the `ngOnChanges` hook is ran
        // and it does happen before the `ngOnInit` where we start
        // listening to `dataInput$`. Therefore, it cannot be a `Subject`
        // or we will miss the first value
        this.dataInput$ = new BehaviorSubject(null);
        // using a private variable `_dataOutput$` to be able to control the
        // emission rate with a debounce or throttle for ex
        /** @internal */
        this._dataOutput$ = new Subject();
        this.emitInitialValueOnInit = false;
        this.emitNullOnDestroy = false;
        this.dataValue = null;
    }
    set disabled(shouldDisable) {
        this.setDisabledState(shouldDisable);
    }
    ngOnInit() {
        // we need to manually call registerOnChange because that function
        // handles most of the logic from NgxSubForm and when it's called
        // as a ControlValueAccessor that function is called by Angular itself
        this.registerOnChange(data => this.onRegisterOnChangeHook(data));
        this.dataInput$
            .pipe(filter(newValue => !isEqual(newValue, this.formGroup.value)), tap(newValue => {
            if (!isNullOrUndefined(newValue)) {
                this.writeValue(newValue);
            }
        }), takeUntilDestroyed(this))
            .subscribe();
        this._dataOutput$
            .pipe(filter(() => this.formGroup.valid), tap(value => this.dataOutput.emit(value)), takeUntilDestroyed(this))
            .subscribe();
    }
    /** @internal */
    onRegisterOnChangeHook(data) {
        if (this.formGroup.invalid || isEqual(data, this.dataInput$.value)) {
            return false;
        }
        this.dataValue = data;
        return true;
    }
    // called by the DataInput decorator
    /** @internal */
    dataInputUpdated(data) {
        this.dataInput$.next(data);
    }
    writeValue(obj) {
        this.dataValue = obj;
        super.writeValue(obj);
    }
    transformToFormGroup(obj, defaultValues) {
        return obj;
    }
    transformFromFormGroup(formValue) {
        return formValue;
    }
    manualSave() {
        if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
            this._dataOutput$.next(this.dataValue);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [Object])
], NgxRootFormComponent.prototype, "disabled", null);
NgxRootFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxRootFormComponent);

let NgxAutomaticRootFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxAutomaticRootFormComponent extends NgxRootFormComponent {
    /** @internal */
    onRegisterOnChangeHook(data) {
        if (!super.onRegisterOnChangeHook(data)) {
            return false;
        }
        if (this.formGroup) {
            this.formGroup.markAsPristine();
            if (this.formGroup.valid) {
                this.manualSave();
            }
        }
        return true;
    }
};
NgxAutomaticRootFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxAutomaticRootFormComponent);

class DataInputUsedOnWrongPropertyError extends Error {
    constructor(calledOnPropertyKey) {
        super(`You're trying to apply the "DataInput" decorator on a property called "${calledOnPropertyKey}". That decorator should only be used on a property called "dataInput"`);
    }
}
function DataInput() {
    return function (target, propertyKey) {
        if (propertyKey !== 'dataInput') {
            throw new DataInputUsedOnWrongPropertyError(propertyKey);
        }
        Object.defineProperty(target, propertyKey, {
            set: function (dataInputValue) {
                this.dataInputUpdated(dataInputValue);
            },
        });
    };
}

/*
 * Public API Surface of sub-form
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DataInput, DataInputUsedOnWrongPropertyError, MissingFormControlsError, NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES, NgxAutomaticRootFormComponent, NgxRootFormComponent, NgxSubFormComponent, NgxSubFormRemapComponent, isNullOrUndefined, subformComponentProviders, takeUntilDestroyed, ɵ0, ɵ1, SUB_FORM_COMPONENT_TOKEN as ɵa };
//# sourceMappingURL=ngx-sub-form.js.map
