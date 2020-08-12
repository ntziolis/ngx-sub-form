import { __decorate, __metadata } from "tslib";
import { Directive } from '@angular/core';
import { FormGroup, FormArray, FormControl, } from '@angular/forms';
import { merge } from 'rxjs';
import { delay, filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import { MissingFormControlsError, isNullOrUndefined, } from './ngx-sub-form-utils';
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
export { NgxSubFormComponent };
let NgxSubFormRemapComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormRemapComponent extends NgxSubFormComponent {
};
NgxSubFormRemapComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormRemapComponent);
export { NgxSubFormRemapComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQWEsU0FBUyxFQUFhLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFJTCxTQUFTLEVBR1QsU0FBUyxFQUNULFdBQVcsR0FDWixNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBRSxLQUFLLEVBQTRCLE1BQU0sTUFBTSxDQUFDO0FBQ3ZELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0UsT0FBTyxFQUtMLHdCQUF3QixFQUV4QixpQkFBaUIsR0FLbEIsTUFBTSxzQkFBc0IsQ0FBQztBQWU5QixJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQWdFdkM7UUF2QlEsZ0JBQVcsR0FBNEIsRUFBRSxDQUFDO1FBRWxELHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBQzFCLGNBQVMsR0FBbUMsSUFBSSxTQUFTLENBQzlELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUN2QixJQUFJLENBQUMsMEJBQTBCLEVBQTRCLENBQ2YsQ0FBQztRQUVyQyxhQUFRLEdBQXlCLFNBQVMsQ0FBQztRQUMzQyxjQUFTLEdBQXlCLFNBQVMsQ0FBQztRQUM1QyxzQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDekIsMkJBQXNCLEdBQUcsSUFBSSxDQUFDO1FBRWhDLGlCQUFZLEdBQTZCLFNBQVMsQ0FBQztRQUUzRCwwRUFBMEU7UUFDMUUsdUVBQXVFO1FBQ3ZFLHlFQUF5RTtRQUN6RSxpRUFBaUU7UUFDekQsb0JBQWUsR0FBRyxLQUFLLENBQUM7UUFHOUIsdUVBQXVFO1FBQ3ZFLE1BQU0sYUFB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SUFDWixtREFBbUQ7OztHQUM3QixtQkFBbUIsQ0F5WXhDO1NBellxQixtQkFBbUI7QUE2WXpDLElBQXNCLHdCQUF3QjtBQUQ5QyxtREFBbUQ7QUFDbkQsTUFBc0Isd0JBQTBELFNBQVEsbUJBR3ZGO0NBTUEsQ0FBQTtBQVRxQix3QkFBd0I7SUFGN0MsU0FBUyxFQUFFO0lBQ1osbURBQW1EO0dBQzdCLHdCQUF3QixDQVM3QztTQVRxQix3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbkRlc3Ryb3ksIERpcmVjdGl2ZSwgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQ29udHJvbFZhbHVlQWNjZXNzb3IsXHJcbiAgRm9ybUdyb3VwLFxyXG4gIFZhbGlkYXRpb25FcnJvcnMsXHJcbiAgVmFsaWRhdG9yLFxyXG4gIEZvcm1BcnJheSxcclxuICBGb3JtQ29udHJvbCxcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IG1lcmdlLCBPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgZGVsYXksIGZpbHRlciwgbWFwLCBzdGFydFdpdGgsIHdpdGhMYXRlc3RGcm9tIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5pbXBvcnQge1xyXG4gIENvbnRyb2xNYXAsXHJcbiAgQ29udHJvbHMsXHJcbiAgQ29udHJvbHNOYW1lcyxcclxuICBGb3JtVXBkYXRlLFxyXG4gIE1pc3NpbmdGb3JtQ29udHJvbHNFcnJvcixcclxuICBGb3JtRXJyb3JzLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBBcnJheVByb3BlcnR5S2V5LFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG4gIFR5cGVkRm9ybUdyb3VwLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBPbkZvcm1VcGRhdGUgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbikgPT4gTWFwVmFsdWU7XHJcbnR5cGUgRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKFxyXG4gIGN0cmw6IFR5cGVkQWJzdHJhY3RDb250cm9sPGFueT4sXHJcbiAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlLFxyXG4gIGlzQ3RybFdpdGhpbkZvcm1BcnJheTogYm9vbGVhbixcclxuKSA9PiBib29sZWFuO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBWYWxpZGF0b3IsIE9uRGVzdHJveSwgT25Gb3JtVXBkYXRlPEZvcm1JbnRlcmZhY2U+IHtcclxuICBwdWJsaWMgZ2V0IGZvcm1Hcm91cENvbnRyb2xzKCk6IENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCB3ZSBuZWVkIHRoZSByZXR1cm4gbnVsbCBoZXJlIGJlY2F1c2Ugd2UgZG8gbm90IHdhbnQgdG8gZXhwb3NlIHRoZSBmYWN0IHRoYXRcclxuICAgIC8vIHRoZSBmb3JtIGNhbiBiZSB1bmRlZmluZWQsIGl0J3MgaGFuZGxlZCBpbnRlcm5hbGx5IHRvIGNvbnRhaW4gYW4gQW5ndWxhciBidWdcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGwgYXMgYW55O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMgYXMgdW5rbm93bikgYXMgQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBmb3JtR3JvdXBWYWx1ZXMoKTogUmVxdWlyZWQ8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkIGZvciBub24tbnVsbCBhc3NlcnRpb24gcmVhc29uXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhjdHJsID0+IGN0cmwudmFsdWUpITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUdyb3VwRXJyb3JzKCk6IEZvcm1FcnJvcnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgY29uc3QgZXJyb3JzOiBGb3JtRXJyb3JzPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5tYXBDb250cm9sczxWYWxpZGF0aW9uRXJyb3JzIHwgVmFsaWRhdGlvbkVycm9yc1tdIHwgbnVsbD4oXHJcbiAgICAgIGN0cmwgPT4gY3RybC5lcnJvcnMsXHJcbiAgICAgIChjdHJsLCBfLCBpc0N0cmxXaXRoaW5Gb3JtQXJyYXkpID0+IChpc0N0cmxXaXRoaW5Gb3JtQXJyYXkgPyB0cnVlIDogY3RybC5pbnZhbGlkKSxcclxuICAgICAgdHJ1ZSxcclxuICAgICkgYXMgRm9ybUVycm9yczxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLmVycm9ycyAmJiAoIWVycm9ycyB8fCAhT2JqZWN0LmtleXMoZXJyb3JzKS5sZW5ndGgpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmZvcm1Hcm91cC5lcnJvcnMgPyB7IGZvcm1Hcm91cDogdGhpcy5mb3JtR3JvdXAuZXJyb3JzIH0gOiB7fSwgZXJyb3JzKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUNvbnRyb2xOYW1lcygpOiBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3IgYXMgc3ludGF4XHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhcclxuICAgICAgKF8sIGtleSkgPT4ga2V5LFxyXG4gICAgICAoKSA9PiB0cnVlLFxyXG4gICAgICBmYWxzZSxcclxuICAgICkgYXMgQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY29udHJvbEtleXM6IChrZXlvZiBGb3JtSW50ZXJmYWNlKVtdID0gW107XHJcblxyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcbiAgcHVibGljIGZvcm1Hcm91cDogVHlwZWRGb3JtR3JvdXA8Rm9ybUludGVyZmFjZT4gPSAobmV3IEZvcm1Hcm91cChcclxuICAgIHRoaXMuX2dldEZvcm1Db250cm9scygpLFxyXG4gICAgdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgKSBhcyB1bmtub3duKSBhcyBUeXBlZEZvcm1Hcm91cDxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHJvdGVjdGVkIG9uQ2hhbmdlOiBGdW5jdGlvbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICBwcm90ZWN0ZWQgb25Ub3VjaGVkOiBGdW5jdGlvbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuXHJcbiAgcHJpdmF0ZSBzdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgLy8gYSBSb290Rm9ybUNvbXBvbmVudCB3aXRoIHRoZSBkaXNhYmxlZCBwcm9wZXJ0eSBzZXQgaW5pdGlhbGx5IHRvIGBmYWxzZWBcclxuICAvLyB3aWxsIGNhbGwgYHNldERpc2FibGVkU3RhdGVgICpiZWZvcmUqIHRoZSBmb3JtIGlzIGFjdHVhbGx5IGF2YWlsYWJsZVxyXG4gIC8vIGFuZCBpdCB3b3VsZG4ndCBiZSBkaXNhYmxlZCBvbmNlIGF2YWlsYWJsZSwgdGhlcmVmb3JlIHdlIHVzZSB0aGlzIGZsYWdcclxuICAvLyB0byBjaGVjayB3aGVuIHRoZSBGb3JtR3JvdXAgaXMgY3JlYXRlZCBpZiB3ZSBzaG91bGQgZGlzYWJsZSBpdFxyXG4gIHByaXZhdGUgY29udHJvbERpc2FibGVkID0gZmFsc2U7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy8gaWYgdGhlIGZvcm0gaGFzIGRlZmF1bHQgdmFsdWVzLCB0aGV5IHNob3VsZCBiZSBhcHBsaWVkIHN0cmFpZ2h0IGF3YXlcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCk7XHJcbiAgICBpZiAoISFkZWZhdWx0VmFsdWVzKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlc2V0KGRlZmF1bHRWYWx1ZXMsIHsgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBgc2V0VGltZW91dGAgYW5kIGB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5YCBhcmUgYm90aCByZXF1aXJlZCBoZXJlXHJcbiAgICAvLyBpbmRlZWQsIGlmIHlvdSBjaGVjayB0aGUgZGVtbyB5b3UnbGwgbm90aWNlIHRoYXQgd2l0aG91dCBpdCwgaWZcclxuICAgIC8vIHlvdSBzZWxlY3QgYERyb2lkYCBhbmQgYEFzc2Fzc2luYCBmb3IgZXhhbXBsZSB0aGUgZGlzcGxheWVkIGVycm9yc1xyXG4gICAgLy8gYXJlIG5vdCB5ZXQgZGVmaW5lZCBmb3IgdGhlIGZpZWxkIGBhc3Nhc3NpbkRyb2lkYFxyXG4gICAgLy8gKHVudGlsIHlvdSBjaGFuZ2Ugb25lIG9mIHRoZSB2YWx1ZSBpbiB0aGF0IGZvcm0pXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAudXBkYXRlVmFsdWVBbmRWYWxpZGl0eSh7IGVtaXRFdmVudDogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbnRyb2xEaXNhYmxlZCkge1xyXG4gICAgICAgICAgdGhpcy5mb3JtR3JvdXAuZGlzYWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSwgMCk7XHJcbiAgfVxyXG5cclxuICAvLyBjYW4ndCBkZWZpbmUgdGhlbSBkaXJlY3RseVxyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRGb3JtQ29udHJvbHMoKTogQ29udHJvbHM8Rm9ybUludGVyZmFjZT47XHJcbiAgcHJpdmF0ZSBfZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIGNvbnN0IGNvbnRyb2xzOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPiA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcblxyXG4gICAgdGhpcy5jb250cm9sS2V5cyA9IChPYmplY3Qua2V5cyhjb250cm9scykgYXMgdW5rbm93bikgYXMgKGtleW9mIEZvcm1JbnRlcmZhY2UpW107XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG9uRm9ybVVwZGF0ZShmb3JtVXBkYXRlOiBGb3JtVXBkYXRlPEZvcm1JbnRlcmZhY2U+KTogdm9pZCB7fVxyXG5cclxuICAvKipcclxuICAgKiBFeHRlbmQgdGhpcyBtZXRob2QgdG8gcHJvdmlkZSBjdXN0b20gbG9jYWwgRm9ybUdyb3VwIGxldmVsIHZhbGlkYXRpb25cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKTogRm9ybUdyb3VwT3B0aW9uczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgdmFsaWRhdGUoKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xyXG4gICAgaWYgKFxyXG4gICAgICAvLyBAaGFjayBzZWUgd2hlcmUgZGVmaW5pbmcgdGhpcy5mb3JtR3JvdXAgdG8gdW5kZWZpbmVkXHJcbiAgICAgICF0aGlzLmZvcm1Hcm91cCB8fFxyXG4gICAgICB0aGlzLmZvcm1Hcm91cC52YWxpZFxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmZvcm1Hcm91cEVycm9ycztcclxuICB9XHJcblxyXG4gIC8vIEB0b2RvIGNvdWxkIHRoaXMgYmUgcmVtb3ZlZCB0byBhdm9pZCBhbiBvdmVycmlkZSBhbmQganVzdCB1c2UgYHRha2VVbnRpbERlc3Ryb3llZGA/XHJcbiAgcHVibGljIG5nT25EZXN0cm95KCk6IHZvaWQge1xyXG4gICAgLy8gQGhhY2sgdGhlcmUncyBhIG1lbW9yeSBsZWFrIHdpdGhpbiBBbmd1bGFyIGFuZCB0aG9zZSBjb21wb25lbnRzXHJcbiAgICAvLyBhcmUgbm90IGNvcnJlY3RseSBjbGVhbmVkIHVwIHdoaWNoIGxlYWRzIHRvIGVycm9yIGlmIGEgZm9ybSBpcyBkZWZpbmVkXHJcbiAgICAvLyB3aXRoIHZhbGlkYXRvcnMgYW5kIHRoZW4gaXQncyBiZWVuIHJlbW92ZWQsIHRoZSB2YWxpZGF0b3Igd291bGQgc3RpbGwgZmFpbFxyXG4gICAgLy8gYGFzIGFueWAgaWYgYmVjYXVzZSB3ZSBkbyBub3Qgd2FudCB0byBkZWZpbmUgdGhlIGZvcm1Hcm91cCBhcyBGb3JtR3JvdXAgfCB1bmRlZmluZWRcclxuICAgIC8vIGV2ZXJ5dGhpbmcgcmVsYXRlZCB0byB1bmRlZmluZWQgaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGFuZCBzaG91bGRuJ3QgYmUgZXhwb3NlZCB0byBlbmQgdXNlclxyXG4gICAgKHRoaXMuZm9ybUdyb3VwIGFzIGFueSkgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZW1pdE51bGxPbkRlc3Ryb3kgJiYgdGhpcy5vbkNoYW5nZSkge1xyXG4gICAgICB0aGlzLm9uQ2hhbmdlKG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub25DaGFuZ2UgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGdldERlZmF1bHRWYWx1ZXMgaXMgZGVmaW5lZCwgeW91IGRvIG5vdCBuZWVkIHRvIHNwZWNpZnkgdGhlIGRlZmF1bHQgdmFsdWVzXHJcbiAgLy8gaW4geW91ciBmb3JtICh0aGUgb25lcyBkZWZpbmVkIHdpdGhpbiB0aGUgYGdldEZvcm1Db250cm9sc2AgbWV0aG9kKVxyXG4gIHByb3RlY3RlZCBnZXREZWZhdWx0VmFsdWVzKCk6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHdyaXRlVmFsdWUob2JqOiBSZXF1aXJlZDxDb250cm9sSW50ZXJmYWNlPiB8IG51bGwpOiB2b2lkIHtcclxuICAgIC8vIEBoYWNrIHNlZSB3aGVyZSBkZWZpbmluZyB0aGlzLmZvcm1Hcm91cCB0byB1bmRlZmluZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCk7XHJcblxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZTogRm9ybUludGVyZmFjZSB8IG51bGwgPSB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgICBvYmogPT09IHVuZGVmaW5lZCA/IG51bGwgOiBvYmosXHJcbiAgICAgIGRlZmF1bHRWYWx1ZXMsXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChpc051bGxPclVuZGVmaW5lZCh0cmFuc2Zvcm1lZFZhbHVlKSkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChcclxuICAgICAgICAvLyBjYWxsaW5nIGByZXNldGAgb24gYSBmb3JtIHdpdGggYG51bGxgIHRocm93cyBhbiBlcnJvciBidXQgaWYgbm90aGluZyBpcyBwYXNzZWRcclxuICAgICAgICAvLyAodW5kZWZpbmVkKSBpdCB3aWxsIHJlc2V0IGFsbCB0aGUgZm9ybSB2YWx1ZXMgdG8gbnVsbCAoYXMgZXhwZWN0ZWQpXHJcbiAgICAgICAgZGVmYXVsdFZhbHVlcyA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IGRlZmF1bHRWYWx1ZXMsXHJcbiAgICAgICAgLy8gZW1pdCB0byBrZWVwIGludGVybmFsIGFuZCBleHRlcm5hbCBpbmZvcm1hdGlvbiBhYm91dCBkYXRhIGluIG9mIGNvbnRyb2wgaW4gc3luYywgd2hlblxyXG4gICAgICAgIC8vIG51bGwvdW5kZWZpbmVkIHdhcyBwYXNzZWQgaW50byB3cml0ZVZhbHVlXHJcbiAgICAgICAgLy8gd2hpbGUgaW50ZXJuYWxseSBiZWluZyByZXBsYWNlZCB3aXRoIGRlZmF1bHRWYWx1ZXNcclxuICAgICAgICB7IGVtaXRFdmVudDogaXNOdWxsT3JVbmRlZmluZWQob2JqKSAmJiAhaXNOdWxsT3JVbmRlZmluZWQoZGVmYXVsdFZhbHVlcykgfSxcclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IG1pc3NpbmdLZXlzOiAoa2V5b2YgRm9ybUludGVyZmFjZSlbXSA9IHRoaXMuZ2V0TWlzc2luZ0tleXModHJhbnNmb3JtZWRWYWx1ZSk7XHJcbiAgICAgIGlmIChtaXNzaW5nS2V5cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdGb3JtQ29udHJvbHNFcnJvcihtaXNzaW5nS2V5cyBhcyBzdHJpbmdbXSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaGFuZGxlRm9ybUFycmF5Q29udHJvbHModHJhbnNmb3JtZWRWYWx1ZSk7XHJcblxyXG4gICAgICAvLyBUaGUgbmV4dCBmZXcgbGluZXMgYXJlIHdlaXJkIGJ1dCBpdCdzIGFzIHdvcmthcm91bmQuXHJcbiAgICAgIC8vIFRoZXJlIGFyZSBzb21lIHNoYWR5IGJlaGF2aW9yIHdpdGggdGhlIGRpc2FibGVkIHN0YXRlXHJcbiAgICAgIC8vIG9mIGEgZm9ybS4gQXBwYXJlbnRseSwgdXNpbmcgYHNldFZhbHVlYCBvbiBhIGRpc2FibGVkXHJcbiAgICAgIC8vIGZvcm0gZG9lcyByZS1lbmFibGUgaXQgKnNvbWV0aW1lcyosIG5vdCBhbHdheXMuXHJcbiAgICAgIC8vIHJlbGF0ZWQgaXNzdWVzOlxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zMTUwNlxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8yMjU1NlxyXG4gICAgICAvLyBidXQgaWYgeW91IGRpc3BsYXkgYHRoaXMuZm9ybUdyb3VwLmRpc2FibGVkYFxyXG4gICAgICAvLyBiZWZvcmUgYW5kIGFmdGVyIHRoZSBgc2V0VmFsdWVgIGlzIGNhbGxlZCwgaXQncyB0aGUgc2FtZVxyXG4gICAgICAvLyByZXN1bHQgd2hpY2ggaXMgZXZlbiB3ZWlyZGVyXHJcbiAgICAgIGNvbnN0IGZnRGlzYWJsZWQ6IGJvb2xlYW4gPSB0aGlzLmZvcm1Hcm91cC5kaXNhYmxlZDtcclxuXHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldFZhbHVlKHRyYW5zZm9ybWVkVmFsdWUsIHtcclxuICAgICAgICAvLyBlbWl0IHRvIGtlZXAgaW50ZXJuYWwgYW5kIGV4dGVybmFsIGluZm9ybWF0aW9uIGFib3V0IGRhdGEgaW4gb2YgY29udHJvbCBpbiBzeW5jLCB3aGVuXHJcbiAgICAgICAgLy8gbnVsbC91bmRlZmluZWQgd2FzIHBhc3NlZCBpbnRvIHdyaXRlVmFsdWVcclxuICAgICAgICAvLyB3aGlsZSBpbnRlcm5hbGx5IGJlaW5nIHJlcGxhY2VkIHdpdGggdHJhbnNmb3JtZWRWYWx1ZVxyXG4gICAgICAgIGVtaXRFdmVudDogaXNOdWxsT3JVbmRlZmluZWQob2JqKSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoZmdEaXNhYmxlZCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmRpc2FibGUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZm9ybUdyb3VwLm1hcmtBc1ByaXN0aW5lKCk7XHJcbiAgICB0aGlzLmZvcm1Hcm91cC5tYXJrQXNVbnRvdWNoZWQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlRm9ybUFycmF5Q29udHJvbHMob2JqOiBhbnkpIHtcclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgbmV3IEZvcm1Db250cm9sKHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCk6IHRoaXMgaXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB0eXBlb2YgKCh0aGlzIGFzIHVua25vd24pIGFzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPikuY3JlYXRlRm9ybUFycmF5Q29udHJvbCA9PT0gJ2Z1bmN0aW9uJztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0TWlzc2luZ0tleXModHJhbnNmb3JtZWRWYWx1ZTogRm9ybUludGVyZmFjZSB8IG51bGwpIHtcclxuICAgIC8vIGBjb250cm9sS2V5c2AgY2FuIGJlIGFuIGVtcHR5IGFycmF5LCBlbXB0eSBmb3JtcyBhcmUgYWxsb3dlZFxyXG4gICAgY29uc3QgbWlzc2luZ0tleXM6IChrZXlvZiBGb3JtSW50ZXJmYWNlKVtdID0gdGhpcy5jb250cm9sS2V5cy5yZWR1Y2UoKGtleXMsIGtleSkgPT4ge1xyXG4gICAgICBpZiAoaXNOdWxsT3JVbmRlZmluZWQodHJhbnNmb3JtZWRWYWx1ZSkgfHwgdHJhbnNmb3JtZWRWYWx1ZVtrZXldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9LCBbXSBhcyAoa2V5b2YgRm9ybUludGVyZmFjZSlbXSk7XHJcblxyXG4gICAgcmV0dXJuIG1pc3NpbmdLZXlzO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHJvdGVjdGVkIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxGb3JtSW50ZXJmYWNlPikgPT4gT2JzZXJ2YWJsZTxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gb2JzJCA9PiBvYnMkO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChvYmogYXMgYW55KSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyBhbnkpIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVnaXN0ZXJPbkNoYW5nZShmbjogKF86IGFueSkgPT4gdm9pZCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5vbkNoYW5nZSA9IGZuO1xyXG5cclxuICAgIGludGVyZmFjZSBLZXlWYWx1ZUZvcm0ge1xyXG4gICAgICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2U7XHJcbiAgICAgIHZhbHVlOiB1bmtub3duO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sTmFtZXM6IChrZXlvZiBGb3JtSW50ZXJmYWNlKVtdID0gT2JqZWN0LmtleXModGhpcy5mb3JtQ29udHJvbE5hbWVzKSBhcyAoa2V5b2YgRm9ybUludGVyZmFjZSlbXTtcclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWVzOiBPYnNlcnZhYmxlPEtleVZhbHVlRm9ybT5bXSA9IGZvcm1Db250cm9sTmFtZXMubWFwKGtleSA9PlxyXG4gICAgICAoKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzW2tleV0gYXMgdW5rbm93bikgYXMgQWJzdHJhY3RDb250cm9sKS52YWx1ZUNoYW5nZXMucGlwZShcclxuICAgICAgICBzdGFydFdpdGgodGhpcy5mb3JtR3JvdXAuY29udHJvbHNba2V5XS52YWx1ZSksXHJcbiAgICAgICAgbWFwKHZhbHVlID0+ICh7IGtleSwgdmFsdWUgfSkpLFxyXG4gICAgICApLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBsYXN0S2V5RW1pdHRlZCQ6IE9ic2VydmFibGU8a2V5b2YgRm9ybUludGVyZmFjZT4gPSBtZXJnZSguLi5mb3JtVmFsdWVzLm1hcChvYnMgPT4gb2JzLnBpcGUobWFwKHggPT4geC5rZXkpKSkpO1xyXG5cclxuICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gdGhpcy5mb3JtR3JvdXAudmFsdWVDaGFuZ2VzXHJcbiAgICAgIC5waXBlKFxyXG4gICAgICAgIC8vIGhvb2sgdG8gZ2l2ZSBhY2Nlc3MgdG8gdGhlIG9ic2VydmFibGUgZm9yIHN1Yi1jbGFzc2VzXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvdyBzdWItY2xhc3NlcyAoZm9yIGV4YW1wbGUpIHRvIGRlYm91bmNlLCB0aHJvdHRsZSwgZXRjXHJcbiAgICAgICAgdGhpcy5oYW5kbGVFbWlzc2lvblJhdGUoKSxcclxuICAgICAgICBzdGFydFdpdGgodGhpcy5mb3JtR3JvdXAudmFsdWUpLFxyXG4gICAgICAgIC8vIHRoaXMgaXMgcmVxdWlyZWQgb3RoZXJ3aXNlIGFuIGBFeHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yYCB3aWxsIGhhcHBlblxyXG4gICAgICAgIC8vIHRoaXMgaXMgZHVlIHRvIHRoZSBmYWN0IHRoYXQgcGFyZW50IGNvbXBvbmVudCB3aWxsIGRlZmluZSBhIGdpdmVuIHN0YXRlIGZvciB0aGUgZm9ybSB0aGF0IG1pZ2h0XHJcbiAgICAgICAgLy8gYmUgY2hhbmdlZCBvbmNlIHRoZSBjaGlsZHJlbiBhcmUgYmVpbmcgaW5pdGlhbGl6ZWRcclxuICAgICAgICBkZWxheSgwKSxcclxuICAgICAgICBmaWx0ZXIoKCkgPT4gISF0aGlzLmZvcm1Hcm91cCksXHJcbiAgICAgICAgLy8gZGV0ZWN0IHdoaWNoIHN0cmVhbSBlbWl0dGVkIGxhc3RcclxuICAgICAgICB3aXRoTGF0ZXN0RnJvbShsYXN0S2V5RW1pdHRlZCQpLFxyXG4gICAgICAgIG1hcCgoW18sIGtleUxhc3RFbWl0XSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgIGlmIChpbmRleCA+IDAgJiYgdGhpcy5vblRvdWNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5vblRvdWNoZWQoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoaW5kZXggPiAwIHx8IChpbmRleCA9PT0gMCAmJiB0aGlzLmVtaXRJbml0aWFsVmFsdWVPbkluaXQpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5vbkNoYW5nZShcclxuICAgICAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChcclxuICAgICAgICAgICAgICAgICAgLy8gZG8gbm90IHVzZSB0aGUgY2hhbmdlcyBwYXNzZWQgYnkgYHRoaXMuZm9ybUdyb3VwLnZhbHVlQ2hhbmdlc2AgaGVyZVxyXG4gICAgICAgICAgICAgICAgICAvLyBhcyB3ZSd2ZSBnb3QgYSBkZWxheSgwKSBhYm92ZSwgb24gdGhlIG5leHQgdGljayB0aGUgZm9ybSBkYXRhIG1pZ2h0XHJcbiAgICAgICAgICAgICAgICAgIC8vIGJlIG91dGRhdGVkIGFuZCBtaWdodCByZXN1bHQgaW50byBhbiBpbmNvbnNpc3RlbnQgc3RhdGUgd2hlcmUgYSBmb3JtXHJcbiAgICAgICAgICAgICAgICAgIC8vIHN0YXRlIGlzIHZhbGlkIChiYXNlIG9uIGxhdGVzdCB2YWx1ZSkgYnV0IHRoZSBwcmV2aW91cyB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAvLyAodGhlIG9uZSBwYXNzZWQgYnkgYHRoaXMuZm9ybUdyb3VwLnZhbHVlQ2hhbmdlc2Agd291bGQgYmUgdGhlIHByZXZpb3VzIG9uZSlcclxuICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtR3JvdXAudmFsdWUsXHJcbiAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZvcm1VcGRhdGU6IEZvcm1VcGRhdGU8Rm9ybUludGVyZmFjZT4gPSB7fTtcclxuICAgICAgICAgICAgZm9ybVVwZGF0ZVtrZXlMYXN0RW1pdF0gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLm9uRm9ybVVwZGF0ZShmb3JtVXBkYXRlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuICAgICAgKVxyXG4gICAgICAuc3Vic2NyaWJlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVnaXN0ZXJPblRvdWNoZWQoZm46IGFueSk6IHZvaWQge1xyXG4gICAgdGhpcy5vblRvdWNoZWQgPSBmbjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXREaXNhYmxlZFN0YXRlKHNob3VsZERpc2FibGU6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiB2b2lkIHtcclxuICAgIHRoaXMuY29udHJvbERpc2FibGVkID0gISFzaG91bGREaXNhYmxlO1xyXG5cclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzaG91bGREaXNhYmxlKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLmRpc2FibGUoeyBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuZW5hYmxlKHsgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=