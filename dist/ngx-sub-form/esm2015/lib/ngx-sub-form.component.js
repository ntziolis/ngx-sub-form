import { __decorate, __metadata } from "tslib";
import { Directive, Input } from '@angular/core';
import { FormArray, FormControl, } from '@angular/forms';
import { coerceToAsyncValidator, coerceToValidator } from './abstract-control-utils';
import { isNullOrUndefined, } from './ngx-sub-form-utils';
import { patchFormControl, SubFormGroup } from './sub-form-group';
let NgxSubFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormComponent {
    constructor() {
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.emitNullOnDestroy = true;
        this.emitInitialValueOnInit = true;
    }
    get formControlNames() {
        // see @note form-group-undefined for as syntax
        return this.mapControls((_, key) => key, () => true, false);
    }
    ngOnChanges(changes) {
        if (changes['dataInput'] === undefined &&
            (changes['formGroup'] === undefined || (changes['formGroup'].firstChange && !changes['formGroup'].currentValue))) {
            return;
        }
        if (!this.formGroup) {
            throw new Error('The subForm input was not provided but is required.');
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
        const dataInputHasChanged = changes['dataInput'] !== undefined;
        this._initializeFormGroup(dataInputHasChanged);
    }
    ngAfterContentChecked() {
        var _a;
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if ((_a = this.formGroup) === null || _a === void 0 ? void 0 : _a.cd) {
            // if this is the root form
            // OR if ist a sub form but the root form does not have a change detector
            // we need to actually run change detection vs just marking for check
            if (!this.formGroup.parent) {
                this.formGroup.cd.detectChanges();
            }
            else {
                this.formGroup.cd.markForCheck();
            }
        }
    }
    // is usually called by ngOnChanges
    // but if root form is used without input attributes ngOnChanges might not be called
    // hence if it wasn't called yet it is called from ngOnInit in root form
    _initializeFormGroup(dataInputHasChanged = false) {
        Object.keys(this.formGroup.controls).forEach(key => {
            this.formGroup.removeControl(key);
        });
        const subForm = this.formGroup;
        const controls = this.getFormControls();
        for (const key in controls) {
            if (controls.hasOwnProperty(key)) {
                const control = controls[key];
                // we need to wire up the form controls with the sub form group
                // this allows us to transform the sub form value to ControlInterface
                // every time any of the form controls on the sub form change
                if (control instanceof FormControl) {
                    patchFormControl(subForm, control);
                }
                this.formGroup.addControl(key, control);
            }
        }
        // connect sub form group with current sub-form-component
        subForm.setSubForm(this);
        const options = this.getFormGroupControlOptions();
        const validators = [];
        const asyncValidators = [];
        // get validators that were passed into the sub form group on the parent
        if (subForm.parentValidatorOrOpts) {
            const validator = coerceToValidator(subForm.parentValidatorOrOpts);
            if (validator) {
                validators.push(validator);
            }
        }
        // get async validators that were passed into the sub form group on the parent
        if (subForm.parentAsyncValidator) {
            const validator = coerceToAsyncValidator(subForm.parentAsyncValidator);
            if (validator) {
                asyncValidators.push(validator);
            }
        }
        // handle AbstractControlOptions from getFormGroupControlOptions
        if (options) {
            if (options.updateOn) {
                // sadly there is no public metohd that lets us change the update strategy of an already created FormGroup
                this.formGroup._setUpdateStrategy(options.updateOn);
            }
            if (options.validators) {
                const validator = coerceToValidator(options.validators);
                if (validator) {
                    validators.push(validator);
                }
            }
            if (options.asyncValidators) {
                const validator = coerceToAsyncValidator(options.asyncValidators);
                if (validator) {
                    asyncValidators.push(validator);
                }
            }
        }
        // set validators / async validators on sub form group
        if (validators.length > 0) {
            this.formGroup.setValidators(validators);
        }
        if (asyncValidators.length > 0) {
            this.formGroup.setAsyncValidators(asyncValidators);
        }
        // if the form has default values, they should be applied straight away
        const defaultValues = this.getDefaultValues();
        // get default values for reset, if null fallback to undefined as there si a difference when calling reset
        const transformedValue = this.transformFromFormGroup(defaultValues) || undefined;
        let mergedValues;
        // not sure if this case is relevant as arrays are sub forms and would be handled by the other logic below
        const controlValue = (dataInputHasChanged ? this['dataInput'] : subForm.controlValue);
        if (transformedValue && controlValue) {
            if (Array.isArray(controlValue)) {
                mergedValues = controlValue;
            }
            else if (Array.isArray(transformedValue)) {
                mergedValues = transformedValue;
            }
            else {
                mergedValues = Object.assign(Object.assign({}, transformedValue), controlValue);
            }
        }
        else if (transformedValue) {
            mergedValues = transformedValue;
        }
        else {
            mergedValues = controlValue;
        }
        const formValue = this.transformToFormGroup(mergedValues, {});
        this.handleFormArrayControls(formValue);
        // self = false is critical here
        // this allows the parent form to re-evaluate its status after each of its sub form has completed intialization
        // we actually only need to call this on the deepest sub form in a tree (leaves)
        // but there is no way to identify if there are sub forms on the current form + that are also rendered
        // as only when sub forms are rendered the on changes method on the sub form is executed
        // TODO decide if we want to emit an event when input control value != control value after intialization
        // this happens for example when null is passed in but default values change the value of the inner form
        this.formGroup.reset(mergedValues, { onlySelf: false, emitEvent: false });
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
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    getFormGroupControlOptions() {
        return {};
    }
    // when getDefaultValues is defined, you do not need to specify the default values
    // in your form (the ones defined within the `getFormControls` method)
    getDefaultValues() {
        return {};
    }
    handleFormArrayControls(obj) {
        // TODO check if this can still happen, it appeared during development. might already be fixed
        if (!this.formGroup) {
            return;
        }
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
                        const control = new FormControl(value[i]);
                        patchFormControl(this.formGroup, control);
                        formArray.insert(i, control);
                    }
                }
            }
        });
    }
    formIsFormWithArrayControls() {
        return typeof this.createFormArrayControl === 'function';
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
        // formGroup values can't be null
        return (obj || defaultValues || {});
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformFromFormGroup(formValue) {
        return formValue;
    }
};
__decorate([
    Input('subForm'),
    __metadata("design:type", Object)
], NgxSubFormComponent.prototype, "formGroup", void 0);
NgxSubFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUE0UjFDLENBQUM7SUF2UkMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQ0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxX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Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJDb250ZW50Q2hlY2tlZCwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yLCBjb2VyY2VUb1ZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtY29udHJvbC11dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgQ29udHJvbHNUeXBlLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgcGF0Y2hGb3JtQ29udHJvbCwgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoY3RybDogQWJzdHJhY3RDb250cm9sLCBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UpID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyQ29udGVudENoZWNrZWQge1xyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8taW5wdXQtcmVuYW1lXHJcbiAgQElucHV0KCdzdWJGb3JtJykgZm9ybUdyb3VwITogVHlwZWRTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IHRydWU7XHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSB0cnVlO1xyXG5cclxuICAvLyBjYW4ndCBkZWZpbmUgdGhlbSBkaXJlY3RseVxyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRGb3JtQ29udHJvbHMoKTogQ29udHJvbHM8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUNvbnRyb2xOYW1lcygpOiBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3IgYXMgc3ludGF4XHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhcclxuICAgICAgKF8sIGtleSkgPT4ga2V5LFxyXG4gICAgICAoKSA9PiB0cnVlLFxyXG4gICAgICBmYWxzZSxcclxuICAgICkgYXMgQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcclxuICAgIGlmIChcclxuICAgICAgY2hhbmdlc1snZGF0YUlucHV0J10gPT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAoY2hhbmdlc1snZm9ybUdyb3VwJ10gPT09IHVuZGVmaW5lZCB8fCAoY2hhbmdlc1snZm9ybUdyb3VwJ10uZmlyc3RDaGFuZ2UgJiYgIWNoYW5nZXNbJ2Zvcm1Hcm91cCddLmN1cnJlbnRWYWx1ZSkpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCB3YXMgbm90IHByb3ZpZGVkIGJ1dCBpcyByZXF1aXJlZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISh0aGlzLmZvcm1Hcm91cCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCBuZWVkcyB0byBiZSBvZiB0eXBlIFN1YkZvcm1Hcm91cC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhSW5wdXRIYXNDaGFuZ2VkID0gY2hhbmdlc1snZGF0YUlucHV0J10gIT09IHVuZGVmaW5lZDtcclxuICAgIHRoaXMuX2luaXRpYWxpemVGb3JtR3JvdXAoZGF0YUlucHV0SGFzQ2hhbmdlZCk7XHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPIHRoaXMgcnVucyB0b28gb2Z0ZW4sIGZpbmQgb3V0IG9mIHRoaXMgY2FuIGJlIHRyaWdnZXJlZCBkaWZmZXJlbnRseVxyXG4gICAgLy8gY2hlY2tpbmcgaWYgdGhlIGZvcm0gZ3JvdXAgaGFzIGEgY2hhbmdlIGRldGVjdG9yIChyb290IGZvcm1zIG1pZ2h0IG5vdClcclxuICAgIGlmICh0aGlzLmZvcm1Hcm91cD8uY2QpIHtcclxuICAgICAgLy8gaWYgdGhpcyBpcyB0aGUgcm9vdCBmb3JtXHJcbiAgICAgIC8vIE9SIGlmIGlzdCBhIHN1YiBmb3JtIGJ1dCB0aGUgcm9vdCBmb3JtIGRvZXMgbm90IGhhdmUgYSBjaGFuZ2UgZGV0ZWN0b3JcclxuICAgICAgLy8gd2UgbmVlZCB0byBhY3R1YWxseSBydW4gY2hhbmdlIGRldGVjdGlvbiB2cyBqdXN0IG1hcmtpbmcgZm9yIGNoZWNrXHJcbiAgICAgIGlmICghdGhpcy5mb3JtR3JvdXAucGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuY2QuZGV0ZWN0Q2hhbmdlcygpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBpcyB1c3VhbGx5IGNhbGxlZCBieSBuZ09uQ2hhbmdlc1xyXG4gIC8vIGJ1dCBpZiByb290IGZvcm0gaXMgdXNlZCB3aXRob3V0IGlucHV0IGF0dHJpYnV0ZXMgbmdPbkNoYW5nZXMgbWlnaHQgbm90IGJlIGNhbGxlZFxyXG4gIC8vIGhlbmNlIGlmIGl0IHdhc24ndCBjYWxsZWQgeWV0IGl0IGlzIGNhbGxlZCBmcm9tIG5nT25Jbml0IGluIHJvb3QgZm9ybVxyXG4gIHByb3RlY3RlZCBfaW5pdGlhbGl6ZUZvcm1Hcm91cChkYXRhSW5wdXRIYXNDaGFuZ2VkOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlbW92ZUNvbnRyb2woa2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YkZvcm0gPSB0aGlzLmZvcm1Hcm91cDtcclxuXHJcbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb250cm9scykge1xyXG4gICAgICBpZiAoY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBjb250cm9sc1trZXldO1xyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHdpcmUgdXAgdGhlIGZvcm0gY29udHJvbHMgd2l0aCB0aGUgc3ViIGZvcm0gZ3JvdXBcclxuICAgICAgICAvLyB0aGlzIGFsbG93cyB1cyB0byB0cmFuc2Zvcm0gdGhlIHN1YiBmb3JtIHZhbHVlIHRvIENvbnRyb2xJbnRlcmZhY2VcclxuICAgICAgICAvLyBldmVyeSB0aW1lIGFueSBvZiB0aGUgZm9ybSBjb250cm9scyBvbiB0aGUgc3ViIGZvcm0gY2hhbmdlXHJcbiAgICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQ29udHJvbCkge1xyXG4gICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbChzdWJGb3JtLCBjb250cm9sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmFkZENvbnRyb2woa2V5LCBjb250cm9sKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbm5lY3Qgc3ViIGZvcm0gZ3JvdXAgd2l0aCBjdXJyZW50IHN1Yi1mb3JtLWNvbXBvbmVudFxyXG4gICAgc3ViRm9ybS5zZXRTdWJGb3JtKHRoaXMpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCkgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucztcclxuXHJcbiAgICBjb25zdCB2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbltdID0gW107XHJcbiAgICBjb25zdCBhc3luY1ZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG5cclxuICAgIC8vIGdldCB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGFzeW5jIHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcikge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBBYnN0cmFjdENvbnRyb2xPcHRpb25zIGZyb20gZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uKSB7XHJcbiAgICAgICAgLy8gc2FkbHkgdGhlcmUgaXMgbm8gcHVibGljIG1ldG9oZCB0aGF0IGxldHMgdXMgY2hhbmdlIHRoZSB1cGRhdGUgc3RyYXRlZ3kgb2YgYW4gYWxyZWFkeSBjcmVhdGVkIEZvcm1Hcm91cFxyXG4gICAgICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpLl9zZXRVcGRhdGVTdHJhdGVneShvcHRpb25zLnVwZGF0ZU9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKG9wdGlvbnMudmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB2YWxpZGF0b3JzIC8gYXN5bmMgdmFsaWRhdG9ycyBvbiBzdWIgZm9ybSBncm91cFxyXG4gICAgaWYgKHZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWxpZGF0b3JzKHZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFzeW5jVmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldEFzeW5jVmFsaWRhdG9ycyhhc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIC8vIGdldCBkZWZhdWx0IHZhbHVlcyBmb3IgcmVzZXQsIGlmIG51bGwgZmFsbGJhY2sgdG8gdW5kZWZpbmVkIGFzIHRoZXJlIHNpIGEgZGlmZmVyZW5jZSB3aGVuIGNhbGxpbmcgcmVzZXRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyBhcyBGb3JtSW50ZXJmYWNlKSB8fCB1bmRlZmluZWQ7XHJcblxyXG4gICAgbGV0IG1lcmdlZFZhbHVlczogQ29udHJvbEludGVyZmFjZTtcclxuICAgIC8vIG5vdCBzdXJlIGlmIHRoaXMgY2FzZSBpcyByZWxldmFudCBhcyBhcnJheXMgYXJlIHN1YiBmb3JtcyBhbmQgd291bGQgYmUgaGFuZGxlZCBieSB0aGUgb3RoZXIgbG9naWMgYmVsb3dcclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAoZGF0YUlucHV0SGFzQ2hhbmdlZCA/ICh0aGlzIGFzIGFueSlbJ2RhdGFJbnB1dCddIDogc3ViRm9ybS5jb250cm9sVmFsdWUpIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcblxyXG4gICAgaWYgKHRyYW5zZm9ybWVkVmFsdWUgJiYgY29udHJvbFZhbHVlKSB7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbnRyb2xWYWx1ZSkpIHtcclxuICAgICAgICAgIG1lcmdlZFZhbHVlcyA9IGNvbnRyb2xWYWx1ZTtcclxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRyYW5zZm9ybWVkVmFsdWUpKSB7XHJcbiAgICAgICAgbWVyZ2VkVmFsdWVzID0gdHJhbnNmb3JtZWRWYWx1ZSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1lcmdlZFZhbHVlcyA9IHsgLi4udHJhbnNmb3JtZWRWYWx1ZSwgLi4uY29udHJvbFZhbHVlIH07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAodHJhbnNmb3JtZWRWYWx1ZSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSB0cmFuc2Zvcm1lZFZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0gY29udHJvbFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPixcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4sXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgKTogQ29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoKSA9PiB0cnVlLFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbiA9IHRydWUsXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sczogQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbHM7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHM6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGZvcm1Db250cm9scykge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtQ29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZUlmQXJyYXkgJiYgY29udHJvbCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgICAgICAgY29uc3QgdmFsdWVzOiBNYXBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZXMucHVzaChtYXBDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwICYmIHZhbHVlcy5zb21lKHggPT4gIWlzTnVsbE9yVW5kZWZpbmVkKHgpKSkge1xyXG4gICAgICAgICAgICBjb250cm9sc1trZXldID0gdmFsdWVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY29udHJvbCAmJiBmaWx0ZXJDb250cm9sKGNvbnRyb2wsIGtleSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICBjb250cm9sc1trZXldID0gbWFwQ29udHJvbChjb250cm9sLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dGVuZCB0aGlzIG1ldGhvZCB0byBwcm92aWRlIGN1c3RvbSBsb2NhbCBGb3JtR3JvdXAgbGV2ZWwgdmFsaWRhdGlvblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpOiBGb3JtR3JvdXBPcHRpb25zPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gZ2V0RGVmYXVsdFZhbHVlcyBpcyBkZWZpbmVkLCB5b3UgZG8gbm90IG5lZWQgdG8gc3BlY2lmeSB0aGUgZGVmYXVsdCB2YWx1ZXNcclxuICAvLyBpbiB5b3VyIGZvcm0gKHRoZSBvbmVzIGRlZmluZWQgd2l0aGluIHRoZSBgZ2V0Rm9ybUNvbnRyb2xzYCBtZXRob2QpXHJcbiAgcHJvdGVjdGVkIGdldERlZmF1bHRWYWx1ZXMoKTogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFuZGxlRm9ybUFycmF5Q29udHJvbHMob2JqOiBhbnkpIHtcclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgdGhpcyBjYW4gc3RpbGwgaGFwcGVuLCBpdCBhcHBlYXJlZCBkdXJpbmcgZGV2ZWxvcG1lbnQuIG1pZ2h0IGFscmVhZHkgYmUgZml4ZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2wodmFsdWVbaV0pO1xyXG4gICAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHRoaXMuZm9ybUdyb3VwLCBjb250cm9sKTtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCBjb250cm9sKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKTogdGhpcyBpcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHR5cGVvZiAoKHRoaXMgYXMgdW5rbm93bikgYXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+KS5jcmVhdGVGb3JtQXJyYXlDb250cm9sID09PSAnZnVuY3Rpb24nO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHVibGljIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4pID0+IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+IHtcclxuICAgIHJldHVybiBvYnMkID0+IG9icyQ7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICAvLyBmb3JtR3JvdXAgdmFsdWVzIGNhbid0IGJlIG51bGxcclxuICAgIHJldHVybiAob2JqIHx8IGRlZmF1bHRWYWx1ZXMgfHwge30pIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAoZm9ybVZhbHVlIGFzIGFueSkgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=