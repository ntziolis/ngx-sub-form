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
            mergedValues = Object.assign(Object.assign({}, transformedValue), { controlValue });
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
        // TODO check if this can still happen, it appreaded during development. might alerady be fixed
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
    transformToFormGroup(obj, fallbackValue) {
        // formGroup values can't be null
        return (obj || fallbackValue || {});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFzUjFDLENBQUM7SUFqUkMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQ0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxX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TyxDQUFDLENBQUM7cUJBQzlCO2lCQUNGO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkI7UUFDakMsT0FBTyxPQUFTLElBQTRELENBQUMsc0JBQXNCLEtBQUssVUFBVSxDQUFDO0lBQ3JILENBQUM7SUFFRCx1R0FBdUc7SUFDdkcsbUdBQW1HO0lBQ25HLGdDQUFnQztJQUN6QixrQkFBa0I7UUFDdkIsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLHlDQUF5QztJQUMvQixvQkFBb0IsQ0FDNUIsR0FBNEIsRUFDNUIsYUFBNEM7UUFFNUMsaUNBQWlDO1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLElBQUksYUFBYSxJQUFJLEVBQUUsQ0FBa0IsQ0FBQztJQUN2RCxDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLHlDQUF5QztJQUMvQixzQkFBc0IsQ0FBQyxTQUF3QjtRQUN2RCxPQUFRLFNBQXFDLENBQUM7SUFDaEQsQ0FBQztDQUNGLENBQUE7QUF6Um1CO0lBQWpCLEtBQUssQ0FBQyxTQUFTLENBQUM7O3NEQUFnRTtBQVA3RCxtQkFBbUI7SUFGeEMsU0FBUyxFQUFFO0lBQ1osbURBQW1EO0dBQzdCLG1CQUFtQixDQWdTeEM7U0FoU3FCLG1CQUFtQjtBQW9TekMsSUFBc0Isd0JBQXdCO0FBRDlDLG1EQUFtRDtBQUNuRCxNQUFzQix3QkFBMEQsU0FBUSxtQkFHdkY7Q0FNQSxDQUFBO0FBVHFCLHdCQUF3QjtJQUY3QyxTQUFTLEVBQUU7SUFDWixtREFBbUQ7R0FDN0Isd0JBQXdCLENBUzdDO1NBVHFCLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyQ29udGVudENoZWNrZWQsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUFycmF5LFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIFZhbGlkYXRvckZuLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlVG9Bc3luY1ZhbGlkYXRvciwgY29lcmNlVG9WYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0LWNvbnRyb2wtdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIEFycmF5UHJvcGVydHlLZXksXHJcbiAgQ29udHJvbE1hcCxcclxuICBDb250cm9scyxcclxuICBDb250cm9sc05hbWVzLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IHBhdGNoRm9ybUNvbnRyb2wsIFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKGN0cmw6IEFic3RyYWN0Q29udHJvbCwga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlKSA9PiBNYXBWYWx1ZTtcclxudHlwZSBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbiAgaXNDdHJsV2l0aGluRm9ybUFycmF5OiBib29sZWFuLFxyXG4pID0+IGJvb2xlYW47XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRDaGVja2VkIHtcclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG5cclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWlucHV0LXJlbmFtZVxyXG4gIEBJbnB1dCgnc3ViRm9ybScpIGZvcm1Hcm91cCE6IFR5cGVkU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGNoYW5nZXNbJ2RhdGFJbnB1dCddID09PSB1bmRlZmluZWQgJiZcclxuICAgICAgKGNoYW5nZXNbJ2Zvcm1Hcm91cCddID09PSB1bmRlZmluZWQgfHwgKGNoYW5nZXNbJ2Zvcm1Hcm91cCddLmZpcnN0Q2hhbmdlICYmICFjaGFuZ2VzWydmb3JtR3JvdXAnXS5jdXJyZW50VmFsdWUpKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgd2FzIG5vdCBwcm92aWRlZCBidXQgaXMgcmVxdWlyZWQuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEodGhpcy5mb3JtR3JvdXAgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgbmVlZHMgdG8gYmUgb2YgdHlwZSBTdWJGb3JtR3JvdXAuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YUlucHV0SGFzQ2hhbmdlZCA9IGNoYW5nZXNbJ2RhdGFJbnB1dCddICE9PSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLl9pbml0aWFsaXplRm9ybUdyb3VwKGRhdGFJbnB1dEhhc0NoYW5nZWQpO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyB0aGlzIHJ1bnMgdG9vIG9mdGVuLCBmaW5kIG91dCBvZiB0aGlzIGNhbiBiZSB0cmlnZ2VyZWQgZGlmZmVyZW50bHlcclxuICAgIC8vIGNoZWNraW5nIGlmIHRoZSBmb3JtIGdyb3VwIGhhcyBhIGNoYW5nZSBkZXRlY3RvciAocm9vdCBmb3JtcyBtaWdodCBub3QpXHJcbiAgICBpZiAodGhpcy5mb3JtR3JvdXA/LmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gaXMgdXN1YWxseSBjYWxsZWQgYnkgbmdPbkNoYW5nZXNcclxuICAvLyBidXQgaWYgcm9vdCBmb3JtIGlzIHVzZWQgd2l0aG91dCBpbnB1dCBhdHRyaWJ1dGVzIG5nT25DaGFuZ2VzIG1pZ2h0IG5vdCBiZSBjYWxsZWRcclxuICAvLyBoZW5jZSBpZiBpdCB3YXNuJ3QgY2FsbGVkIHlldCBpdCBpcyBjYWxsZWQgZnJvbSBuZ09uSW5pdCBpbiByb290IGZvcm1cclxuICBwcm90ZWN0ZWQgX2luaXRpYWxpemVGb3JtR3JvdXAoZGF0YUlucHV0SGFzQ2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1Hcm91cC5jb250cm9scykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZW1vdmVDb250cm9sKGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJGb3JtID0gdGhpcy5mb3JtR3JvdXA7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udHJvbHMpIHtcclxuICAgICAgaWYgKGNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gY29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3aXJlIHVwIHRoZSBmb3JtIGNvbnRyb2xzIHdpdGggdGhlIHN1YiBmb3JtIGdyb3VwXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNmb3JtIHRoZSBzdWIgZm9ybSB2YWx1ZSB0byBDb250cm9sSW50ZXJmYWNlXHJcbiAgICAgICAgLy8gZXZlcnkgdGltZSBhbnkgb2YgdGhlIGZvcm0gY29udHJvbHMgb24gdGhlIHN1YiBmb3JtIGNoYW5nZVxyXG4gICAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgRm9ybUNvbnRyb2wpIHtcclxuICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2woc3ViRm9ybSwgY29udHJvbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5hZGRDb250cm9sKGtleSwgY29udHJvbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25uZWN0IHN1YiBmb3JtIGdyb3VwIHdpdGggY3VycmVudCBzdWItZm9ybS1jb21wb25lbnRcclxuICAgIHN1YkZvcm0uc2V0U3ViRm9ybSh0aGlzKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdG9yczogVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG4gICAgY29uc3QgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZuW10gPSBbXTtcclxuXHJcbiAgICAvLyBnZXQgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cykge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cyk7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBhc3luYyB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgQWJzdHJhY3RDb250cm9sT3B0aW9ucyBmcm9tIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbikge1xyXG4gICAgICAgIC8vIHNhZGx5IHRoZXJlIGlzIG5vIHB1YmxpYyBtZXRvaGQgdGhhdCBsZXRzIHVzIGNoYW5nZSB0aGUgdXBkYXRlIHN0cmF0ZWd5IG9mIGFuIGFscmVhZHkgY3JlYXRlZCBGb3JtR3JvdXBcclxuICAgICAgICAodGhpcy5mb3JtR3JvdXAgYXMgYW55KS5fc2V0VXBkYXRlU3RyYXRlZ3kob3B0aW9ucy51cGRhdGVPbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihvcHRpb25zLnZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihvcHRpb25zLmFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdmFsaWRhdG9ycyAvIGFzeW5jIHZhbGlkYXRvcnMgb24gc3ViIGZvcm0gZ3JvdXBcclxuICAgIGlmICh2YWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0VmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcclxuICAgIH1cclxuICAgIGlmIChhc3luY1ZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGUgZm9ybSBoYXMgZGVmYXVsdCB2YWx1ZXMsIHRoZXkgc2hvdWxkIGJlIGFwcGxpZWQgc3RyYWlnaHQgYXdheVxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKTtcclxuXHJcbiAgICAvLyBnZXQgZGVmYXVsdCB2YWx1ZXMgZm9yIHJlc2V0LCBpZiBudWxsIGZhbGxiYWNrIHRvIHVuZGVmaW5lZCBhcyB0aGVyZSBzaSBhIGRpZmZlcmVuY2Ugd2hlbiBjYWxsaW5nIHJlc2V0XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMgYXMgRm9ybUludGVyZmFjZSkgfHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIGxldCBtZXJnZWRWYWx1ZXM6IENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICAvLyBub3Qgc3VyZSBpZiB0aGlzIGNhc2UgaXMgcmVsZXZhbnQgYXMgYXJyYXlzIGFyZSBzdWIgZm9ybXMgYW5kIHdvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIG90aGVyIGxvZ2ljIGJlbG93XHJcblxyXG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gKGRhdGFJbnB1dEhhc0NoYW5nZWQgPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG5cclxuICAgIGlmICh0cmFuc2Zvcm1lZFZhbHVlICYmIGNvbnRyb2xWYWx1ZSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSB7IC4uLnRyYW5zZm9ybWVkVmFsdWUsIGNvbnRyb2xWYWx1ZSB9O1xyXG4gICAgfSBlbHNlIGlmICh0cmFuc2Zvcm1lZFZhbHVlKSB7XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHRyYW5zZm9ybWVkVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSBjb250cm9sVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChtZXJnZWRWYWx1ZXMsIHt9KTtcclxuICAgIHRoaXMuaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICAvLyBzZWxmID0gZmFsc2UgaXMgY3JpdGljYWwgaGVyZVxyXG4gICAgLy8gdGhpcyBhbGxvd3MgdGhlIHBhcmVudCBmb3JtIHRvIHJlLWV2YWx1YXRlIGl0cyBzdGF0dXMgYWZ0ZXIgZWFjaCBvZiBpdHMgc3ViIGZvcm0gaGFzIGNvbXBsZXRlZCBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB3ZSBhY3R1YWxseSBvbmx5IG5lZWQgdG8gY2FsbCB0aGlzIG9uIHRoZSBkZWVwZXN0IHN1YiBmb3JtIGluIGEgdHJlZSAobGVhdmVzKVxyXG4gICAgLy8gYnV0IHRoZXJlIGlzIG5vIHdheSB0byBpZGVudGlmeSBpZiB0aGVyZSBhcmUgc3ViIGZvcm1zIG9uIHRoZSBjdXJyZW50IGZvcm0gKyB0aGF0IGFyZSBhbHNvIHJlbmRlcmVkXHJcbiAgICAvLyBhcyBvbmx5IHdoZW4gc3ViIGZvcm1zIGFyZSByZW5kZXJlZCB0aGUgb24gY2hhbmdlcyBtZXRob2Qgb24gdGhlIHN1YiBmb3JtIGlzIGV4ZWN1dGVkXHJcblxyXG4gICAgLy8gVE9ETyBkZWNpZGUgaWYgd2Ugd2FudCB0byBlbWl0IGFuIGV2ZW50IHdoZW4gaW5wdXQgY29udHJvbCB2YWx1ZSAhPSBjb250cm9sIHZhbHVlIGFmdGVyIGludGlhbGl6YXRpb25cclxuICAgIC8vIHRoaXMgaGFwcGVucyBmb3IgZXhhbXBsZSB3aGVuIG51bGwgaXMgcGFzc2VkIGluIGJ1dCBkZWZhdWx0IHZhbHVlcyBjaGFuZ2UgdGhlIHZhbHVlIG9mIHRoZSBpbm5lciBmb3JtXHJcbiAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChtZXJnZWRWYWx1ZXMsIHsgb25seVNlbGY6IGZhbHNlLCBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVGb3JtQXJyYXlDb250cm9scyhvYmo6IGFueSkge1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGNhbiBzdGlsbCBoYXBwZW4sIGl0IGFwcHJlYWRlZCBkdXJpbmcgZGV2ZWxvcG1lbnQuIG1pZ2h0IGFsZXJhZHkgYmUgZml4ZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2wodmFsdWVbaV0pO1xyXG4gICAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHRoaXMuZm9ybUdyb3VwLCBjb250cm9sKTtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCBjb250cm9sKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKTogdGhpcyBpcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHR5cGVvZiAoKHRoaXMgYXMgdW5rbm93bikgYXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+KS5jcmVhdGVGb3JtQXJyYXlDb250cm9sID09PSAnZnVuY3Rpb24nO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHVibGljIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4pID0+IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+IHtcclxuICAgIHJldHVybiBvYnMkID0+IG9icyQ7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBmYWxsYmFja1ZhbHVlOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICAvLyBmb3JtR3JvdXAgdmFsdWVzIGNhbid0IGJlIG51bGxcclxuICAgIHJldHVybiAob2JqIHx8IGZhbGxiYWNrVmFsdWUgfHwge30pIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAoZm9ybVZhbHVlIGFzIGFueSkgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBmYWxsYmFja1ZhbHVlOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=