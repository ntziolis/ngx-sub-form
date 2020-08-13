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
        if (changes['dataInput'] === undefined && changes['formGroup'] === undefined) {
            return;
        }
        if (!this.formGroup) {
            throw new Error('The subForm input was not provided but is required.');
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
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
        // since this is the initial setting of form values do NOT emit an event
        let mergedValues;
        if (Array.isArray(transformedValue)) {
            mergedValues = subForm.controlValue;
        }
        else {
            const controlValue = (changes['dataInput'] ? this['dataInput'] : subForm.controlValue) || {};
            mergedValues = Object.assign(Object.assign({}, transformedValue), controlValue);
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
    transformToFormGroup(obj, defaultValues) {
        return obj;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFzUTFDLENBQUM7SUFqUUMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVFLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE1BQU0s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QTRCLEVBQzVCLGFBQTRDO1FBRTVDLE9BQVEsR0FBNEIsQ0FBQztJQUN2QyxDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLHlDQUF5QztJQUMvQixzQkFBc0IsQ0FBQyxTQUF3QjtRQUN2RCxPQUFRLFNBQXFDLENBQUM7SUFDaEQsQ0FBQztDQUNGLENBQUE7QUF6UW1CO0lBQWpCLEtBQUssQ0FBQyxTQUFTLENBQUM7O3NEQUFnRTtBQVA3RCxtQkFBbUI7SUFGeEMsU0FBUyxFQUFFO0lBQ1osbURBQW1EO0dBQzdCLG1CQUFtQixDQWdSeEM7U0FoUnFCLG1CQUFtQjtBQW9SekMsSUFBc0Isd0JBQXdCO0FBRDlDLG1EQUFtRDtBQUNuRCxNQUFzQix3QkFBMEQsU0FBUSxtQkFHdkY7Q0FNQSxDQUFBO0FBVHFCLHdCQUF3QjtJQUY3QyxTQUFTLEVBQUU7SUFDWixtREFBbUQ7R0FDN0Isd0JBQXdCLENBUzdDO1NBVHFCLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyQ29udGVudENoZWNrZWQsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUFycmF5LFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIFZhbGlkYXRvckZuLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlVG9Bc3luY1ZhbGlkYXRvciwgY29lcmNlVG9WYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0LWNvbnRyb2wtdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIEFycmF5UHJvcGVydHlLZXksXHJcbiAgQ29udHJvbE1hcCxcclxuICBDb250cm9scyxcclxuICBDb250cm9sc05hbWVzLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IHBhdGNoRm9ybUNvbnRyb2wsIFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKGN0cmw6IEFic3RyYWN0Q29udHJvbCwga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlKSA9PiBNYXBWYWx1ZTtcclxudHlwZSBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbiAgaXNDdHJsV2l0aGluRm9ybUFycmF5OiBib29sZWFuLFxyXG4pID0+IGJvb2xlYW47XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRDaGVja2VkIHtcclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG5cclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWlucHV0LXJlbmFtZVxyXG4gIEBJbnB1dCgnc3ViRm9ybScpIGZvcm1Hcm91cCE6IFR5cGVkU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBpZiAoY2hhbmdlc1snZGF0YUlucHV0J10gPT09IHVuZGVmaW5lZCAmJiBjaGFuZ2VzWydmb3JtR3JvdXAnXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgd2FzIG5vdCBwcm92aWRlZCBidXQgaXMgcmVxdWlyZWQuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEodGhpcy5mb3JtR3JvdXAgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgbmVlZHMgdG8gYmUgb2YgdHlwZSBTdWJGb3JtR3JvdXAuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmtleXModGhpcy5mb3JtR3JvdXAuY29udHJvbHMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAucmVtb3ZlQ29udHJvbChrZXkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3ViRm9ybSA9IHRoaXMuZm9ybUdyb3VwO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5nZXRGb3JtQ29udHJvbHMoKTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbnRyb2xzKSB7XHJcbiAgICAgIGlmIChjb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gd2lyZSB1cCB0aGUgZm9ybSBjb250cm9scyB3aXRoIHRoZSBzdWIgZm9ybSBncm91cFxyXG4gICAgICAgIC8vIHRoaXMgYWxsb3dzIHVzIHRvIHRyYW5zZm9ybSB0aGUgc3ViIGZvcm0gdmFsdWUgdG8gQ29udHJvbEludGVyZmFjZVxyXG4gICAgICAgIC8vIGV2ZXJ5IHRpbWUgYW55IG9mIHRoZSBmb3JtIGNvbnRyb2xzIG9uIHRoZSBzdWIgZm9ybSBjaGFuZ2VcclxuICAgICAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIEZvcm1Db250cm9sKSB7XHJcbiAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHN1YkZvcm0sIGNvbnRyb2wpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuYWRkQ29udHJvbChrZXksIGNvbnRyb2wpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29ubmVjdCBzdWIgZm9ybSBncm91cCB3aXRoIGN1cnJlbnQgc3ViLWZvcm0tY29tcG9uZW50XHJcbiAgICBzdWJGb3JtLnNldFN1YkZvcm0odGhpcyk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKSBhcyBBYnN0cmFjdENvbnRyb2xPcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHZhbGlkYXRvcnM6IFZhbGlkYXRvckZuW10gPSBbXTtcclxuICAgIGNvbnN0IGFzeW5jVmFsaWRhdG9yczogQXN5bmNWYWxpZGF0b3JGbltdID0gW107XHJcblxyXG4gICAgLy8gZ2V0IHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBnZXQgYXN5bmMgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcik7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGFuZGxlIEFic3RyYWN0Q29udHJvbE9wdGlvbnMgZnJvbSBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9uc1xyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgaWYgKG9wdGlvbnMudXBkYXRlT24pIHtcclxuICAgICAgICAvLyBzYWRseSB0aGVyZSBpcyBubyBwdWJsaWMgbWV0b2hkIHRoYXQgbGV0cyB1cyBjaGFuZ2UgdGhlIHVwZGF0ZSBzdHJhdGVneSBvZiBhbiBhbHJlYWR5IGNyZWF0ZWQgRm9ybUdyb3VwXHJcbiAgICAgICAgKHRoaXMuZm9ybUdyb3VwIGFzIGFueSkuX3NldFVwZGF0ZVN0cmF0ZWd5KG9wdGlvbnMudXBkYXRlT24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Iob3B0aW9ucy52YWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLmFzeW5jVmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Iob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHZhbGlkYXRvcnMgLyBhc3luYyB2YWxpZGF0b3JzIG9uIHN1YiBmb3JtIGdyb3VwXHJcbiAgICBpZiAodmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldFZhbGlkYXRvcnModmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXN5bmNWYWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0QXN5bmNWYWxpZGF0b3JzKGFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgdGhlIGZvcm0gaGFzIGRlZmF1bHQgdmFsdWVzLCB0aGV5IHNob3VsZCBiZSBhcHBsaWVkIHN0cmFpZ2h0IGF3YXlcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCk7XHJcblxyXG4gICAgLy8gZ2V0IGRlZmF1bHQgdmFsdWVzIGZvciByZXNldCwgaWYgbnVsbCBmYWxsYmFjayB0byB1bmRlZmluZWQgYXMgdGhlcmUgc2kgYSBkaWZmZXJlbmNlIHdoZW4gY2FsbGluZyByZXNldFxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChkZWZhdWx0VmFsdWVzIGFzIEZvcm1JbnRlcmZhY2UpIHx8IHVuZGVmaW5lZDtcclxuICAgIC8vIHNpbmNlIHRoaXMgaXMgdGhlIGluaXRpYWwgc2V0dGluZyBvZiBmb3JtIHZhbHVlcyBkbyBOT1QgZW1pdCBhbiBldmVudFxyXG5cclxuICAgIGxldCBtZXJnZWRWYWx1ZXM6IENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmFuc2Zvcm1lZFZhbHVlKSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSBzdWJGb3JtLmNvbnRyb2xWYWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IChjaGFuZ2VzWydkYXRhSW5wdXQnXSA/ICh0aGlzIGFzIGFueSlbJ2RhdGFJbnB1dCddIDogc3ViRm9ybS5jb250cm9sVmFsdWUpIHx8IHt9O1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSB7IC4uLnRyYW5zZm9ybWVkVmFsdWUsIC4uLmNvbnRyb2xWYWx1ZSB9IGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChtZXJnZWRWYWx1ZXMsIHt9KTtcclxuICAgIHRoaXMuaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICAvLyBzZWxmID0gZmFsc2UgaXMgY3JpdGljYWwgaGVyZVxyXG4gICAgLy8gdGhpcyBhbGxvd3MgdGhlIHBhcmVudCBmb3JtIHRvIHJlLWV2YWx1YXRlIGl0cyBzdGF0dXMgYWZ0ZXIgZWFjaCBvZiBpdHMgc3ViIGZvcm0gaGFzIGNvbXBsZXRlZCBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB3ZSBhY3R1YWxseSBvbmx5IG5lZWQgdG8gY2FsbCB0aGlzIG9uIHRoZSBkZWVwZXN0IHN1YiBmb3JtIGluIGEgdHJlZSAobGVhdmVzKVxyXG4gICAgLy8gYnV0IHRoZXJlIGlzIG5vIHdheSB0byBpZGVudGlmeSBpZiB0aGVyZSBhcmUgc3ViIGZvcm1zIG9uIHRoZSBjdXJyZW50IGZvcm0gKyB0aGF0IGFyZSBhbHNvIHJlbmRlcmVkXHJcbiAgICAvLyBhcyBvbmx5IHdoZW4gc3ViIGZvcm1zIGFyZSByZW5kZXJlZCB0aGUgb24gY2hhbmdlcyBtZXRob2Qgb24gdGhlIHN1YiBmb3JtIGlzIGV4ZWN1dGVkXHJcblxyXG4gICAgLy8gVE9ETyBkZWNpZGUgaWYgd2Ugd2FudCB0byBlbWl0IGFuIGV2ZW50IHdoZW4gaW5wdXQgY29udHJvbCB2YWx1ZSAhPSBjb250cm9sIHZhbHVlIGFmdGVyIGludGlhbGl6YXRpb25cclxuICAgIC8vIHRoaXMgaGFwcGVucyBmb3IgZXhhbXBsZSB3aGVuIG51bGwgaXMgcGFzc2VkIGluIGJ1dCBkZWZhdWx0IHZhbHVlcyBjaGFuZ2UgdGhlIHZhbHVlIG9mIHRoZSBpbm5lciBmb3JtXHJcbiAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChtZXJnZWRWYWx1ZXMsIHsgb25seVNlbGY6IGZhbHNlLCBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyB0aGlzIHJ1bnMgdG9vIG9mdGVuLCBmaW5kIG91dCBvZiB0aGlzIGNhbiBiZSB0cmlnZ2VyZWQgZGlmZmVyZW50bHlcclxuICAgIC8vIGNoZWNraW5nIGlmIHRoZSBmb3JtIGdyb3VwIGhhcyBhIGNoYW5nZSBkZXRlY3RvciAocm9vdCBmb3JtcyBtaWdodCBub3QpXHJcbiAgICBpZiAodGhpcy5mb3JtR3JvdXA/LmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVGb3JtQXJyYXlDb250cm9scyhvYmo6IGFueSkge1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGNhbiBzdGlsbCBoYXBwZW4sIGl0IGFwcHJlYWRlZCBkdXJpbmcgZGV2ZWxvcG1lbnQuIG1pZ2h0IGFsZXJhZHkgYmUgZml4ZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2wodmFsdWVbaV0pO1xyXG4gICAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHRoaXMuZm9ybUdyb3VwLCBjb250cm9sKTtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCBjb250cm9sKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKTogdGhpcyBpcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHR5cGVvZiAoKHRoaXMgYXMgdW5rbm93bikgYXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+KS5jcmVhdGVGb3JtQXJyYXlDb250cm9sID09PSAnZnVuY3Rpb24nO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHVibGljIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4pID0+IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+IHtcclxuICAgIHJldHVybiBvYnMkID0+IG9icyQ7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKG9iaiBhcyBhbnkpIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAoZm9ybVZhbHVlIGFzIGFueSkgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=