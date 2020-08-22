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
            (changes['formGroup'] === undefined ||
                (changes['formGroup'].firstChange && !changes['formGroup'].currentValue))) {
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
        // // TODO this runs too often, find out of this can be triggered differently
        // // checking if the form group has a change detector (root forms might not)
        // if (this.formGroup?.cd) {
        //   // if this is the root form
        //   // OR if ist a sub form but the root form does not have a change detector
        //   // we need to actually run change detection vs just marking for check
        //   if (!this.formGroup.parent) {
        //     this.formGroup.cd.detectChanges();
        //   } else {
        //     this.formGroup.cd.markForCheck();
        //   }
        // }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUEwUTFDLENBQUM7SUFyUUMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQ0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUztnQkFDakMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFD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QUFDO0lBQ3ZDLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLHNCQUFzQixDQUFDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBcUMsQ0FBQztJQUNoRCxDQUFDO0NBQ0YsQ0FBQTtBQTdRbUI7SUFBakIsS0FBSyxDQUFDLFNBQVMsQ0FBQzs7c0RBQWdFO0FBUDdELG1CQUFtQjtJQUZ4QyxTQUFTLEVBQUU7SUFDWixtREFBbUQ7R0FDN0IsbUJBQW1CLENBb1J4QztTQXBScUIsbUJBQW1CO0FBd1J6QyxJQUFzQix3QkFBd0I7QUFEOUMsbURBQW1EO0FBQ25ELE1BQXNCLHdCQUEwRCxTQUFRLG1CQUd2RjtDQU1BLENBQUE7QUFUcUIsd0JBQXdCO0lBRjdDLFNBQVMsRUFBRTtJQUNaLG1EQUFtRDtHQUM3Qix3QkFBd0IsQ0FTN0M7U0FUcUIsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJDb250ZW50Q2hlY2tlZCwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yLCBjb2VyY2VUb1ZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtY29udHJvbC11dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgQ29udHJvbHNUeXBlLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgcGF0Y2hGb3JtQ29udHJvbCwgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoY3RybDogQWJzdHJhY3RDb250cm9sLCBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UpID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyQ29udGVudENoZWNrZWQge1xyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8taW5wdXQtcmVuYW1lXHJcbiAgQElucHV0KCdzdWJGb3JtJykgZm9ybUdyb3VwITogVHlwZWRTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IHRydWU7XHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSB0cnVlO1xyXG5cclxuICAvLyBjYW4ndCBkZWZpbmUgdGhlbSBkaXJlY3RseVxyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRGb3JtQ29udHJvbHMoKTogQ29udHJvbHM8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUNvbnRyb2xOYW1lcygpOiBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3IgYXMgc3ludGF4XHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhcclxuICAgICAgKF8sIGtleSkgPT4ga2V5LFxyXG4gICAgICAoKSA9PiB0cnVlLFxyXG4gICAgICBmYWxzZSxcclxuICAgICkgYXMgQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcclxuICAgIGlmIChcclxuICAgICAgY2hhbmdlc1snZGF0YUlucHV0J10gPT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAoY2hhbmdlc1snZm9ybUdyb3VwJ10gPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgIChjaGFuZ2VzWydmb3JtR3JvdXAnXS5maXJzdENoYW5nZSAmJiAhY2hhbmdlc1snZm9ybUdyb3VwJ10uY3VycmVudFZhbHVlKSlcclxuICAgICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IHdhcyBub3QgcHJvdmlkZWQgYnV0IGlzIHJlcXVpcmVkLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMuZm9ybUdyb3VwIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IG5lZWRzIHRvIGJlIG9mIHR5cGUgU3ViRm9ybUdyb3VwLicpO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlbW92ZUNvbnRyb2woa2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YkZvcm0gPSB0aGlzLmZvcm1Hcm91cDtcclxuXHJcbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb250cm9scykge1xyXG4gICAgICBpZiAoY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBjb250cm9sc1trZXldO1xyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHdpcmUgdXAgdGhlIGZvcm0gY29udHJvbHMgd2l0aCB0aGUgc3ViIGZvcm0gZ3JvdXBcclxuICAgICAgICAvLyB0aGlzIGFsbG93cyB1cyB0byB0cmFuc2Zvcm0gdGhlIHN1YiBmb3JtIHZhbHVlIHRvIENvbnRyb2xJbnRlcmZhY2VcclxuICAgICAgICAvLyBldmVyeSB0aW1lIGFueSBvZiB0aGUgZm9ybSBjb250cm9scyBvbiB0aGUgc3ViIGZvcm0gY2hhbmdlXHJcbiAgICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQ29udHJvbCkge1xyXG4gICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbChzdWJGb3JtLCBjb250cm9sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmFkZENvbnRyb2woa2V5LCBjb250cm9sKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbm5lY3Qgc3ViIGZvcm0gZ3JvdXAgd2l0aCBjdXJyZW50IHN1Yi1mb3JtLWNvbXBvbmVudFxyXG4gICAgc3ViRm9ybS5zZXRTdWJGb3JtKHRoaXMpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCkgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucztcclxuXHJcbiAgICBjb25zdCB2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbltdID0gW107XHJcbiAgICBjb25zdCBhc3luY1ZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG5cclxuICAgIC8vIGdldCB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGFzeW5jIHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcikge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBBYnN0cmFjdENvbnRyb2xPcHRpb25zIGZyb20gZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uKSB7XHJcbiAgICAgICAgLy8gc2FkbHkgdGhlcmUgaXMgbm8gcHVibGljIG1ldG9oZCB0aGF0IGxldHMgdXMgY2hhbmdlIHRoZSB1cGRhdGUgc3RyYXRlZ3kgb2YgYW4gYWxyZWFkeSBjcmVhdGVkIEZvcm1Hcm91cFxyXG4gICAgICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpLl9zZXRVcGRhdGVTdHJhdGVneShvcHRpb25zLnVwZGF0ZU9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKG9wdGlvbnMudmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB2YWxpZGF0b3JzIC8gYXN5bmMgdmFsaWRhdG9ycyBvbiBzdWIgZm9ybSBncm91cFxyXG4gICAgaWYgKHZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWxpZGF0b3JzKHZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFzeW5jVmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldEFzeW5jVmFsaWRhdG9ycyhhc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIC8vIGdldCBkZWZhdWx0IHZhbHVlcyBmb3IgcmVzZXQsIGlmIG51bGwgZmFsbGJhY2sgdG8gdW5kZWZpbmVkIGFzIHRoZXJlIHNpIGEgZGlmZmVyZW5jZSB3aGVuIGNhbGxpbmcgcmVzZXRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyBhcyBGb3JtSW50ZXJmYWNlKSB8fCB1bmRlZmluZWQ7XHJcbiAgICAvLyBzaW5jZSB0aGlzIGlzIHRoZSBpbml0aWFsIHNldHRpbmcgb2YgZm9ybSB2YWx1ZXMgZG8gTk9UIGVtaXQgYW4gZXZlbnRcclxuXHJcbiAgICBsZXQgbWVyZ2VkVmFsdWVzOiBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodHJhbnNmb3JtZWRWYWx1ZSkpIHtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0gc3ViRm9ybS5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBjb250cm9sVmFsdWUgPSAoY2hhbmdlc1snZGF0YUlucHV0J10gPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSB8fCB7fTtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0geyAuLi50cmFuc2Zvcm1lZFZhbHVlLCAuLi5jb250cm9sVmFsdWUgfSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpOiB2b2lkIHtcclxuICAgIC8vIC8vIFRPRE8gdGhpcyBydW5zIHRvbyBvZnRlbiwgZmluZCBvdXQgb2YgdGhpcyBjYW4gYmUgdHJpZ2dlcmVkIGRpZmZlcmVudGx5XHJcbiAgICAvLyAvLyBjaGVja2luZyBpZiB0aGUgZm9ybSBncm91cCBoYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgKHJvb3QgZm9ybXMgbWlnaHQgbm90KVxyXG4gICAgLy8gaWYgKHRoaXMuZm9ybUdyb3VwPy5jZCkge1xyXG4gICAgLy8gICAvLyBpZiB0aGlzIGlzIHRoZSByb290IGZvcm1cclxuICAgIC8vICAgLy8gT1IgaWYgaXN0IGEgc3ViIGZvcm0gYnV0IHRoZSByb290IGZvcm0gZG9lcyBub3QgaGF2ZSBhIGNoYW5nZSBkZXRlY3RvclxyXG4gICAgLy8gICAvLyB3ZSBuZWVkIHRvIGFjdHVhbGx5IHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIHZzIGp1c3QgbWFya2luZyBmb3IgY2hlY2tcclxuICAgIC8vICAgaWYgKCF0aGlzLmZvcm1Hcm91cC5wYXJlbnQpIHtcclxuICAgIC8vICAgICB0aGlzLmZvcm1Hcm91cC5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICAvLyAgIH0gZWxzZSB7XHJcbiAgICAvLyAgICAgdGhpcy5mb3JtR3JvdXAuY2QubWFya0ZvckNoZWNrKCk7XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPixcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4sXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgKTogQ29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoKSA9PiB0cnVlLFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbiA9IHRydWUsXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sczogQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbHM7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHM6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGZvcm1Db250cm9scykge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtQ29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZUlmQXJyYXkgJiYgY29udHJvbCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgICAgICAgY29uc3QgdmFsdWVzOiBNYXBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZXMucHVzaChtYXBDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwICYmIHZhbHVlcy5zb21lKHggPT4gIWlzTnVsbE9yVW5kZWZpbmVkKHgpKSkge1xyXG4gICAgICAgICAgICBjb250cm9sc1trZXldID0gdmFsdWVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY29udHJvbCAmJiBmaWx0ZXJDb250cm9sKGNvbnRyb2wsIGtleSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICBjb250cm9sc1trZXldID0gbWFwQ29udHJvbChjb250cm9sLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dGVuZCB0aGlzIG1ldGhvZCB0byBwcm92aWRlIGN1c3RvbSBsb2NhbCBGb3JtR3JvdXAgbGV2ZWwgdmFsaWRhdGlvblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpOiBGb3JtR3JvdXBPcHRpb25zPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gZ2V0RGVmYXVsdFZhbHVlcyBpcyBkZWZpbmVkLCB5b3UgZG8gbm90IG5lZWQgdG8gc3BlY2lmeSB0aGUgZGVmYXVsdCB2YWx1ZXNcclxuICAvLyBpbiB5b3VyIGZvcm0gKHRoZSBvbmVzIGRlZmluZWQgd2l0aGluIHRoZSBgZ2V0Rm9ybUNvbnRyb2xzYCBtZXRob2QpXHJcbiAgcHJvdGVjdGVkIGdldERlZmF1bHRWYWx1ZXMoKTogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFuZGxlRm9ybUFycmF5Q29udHJvbHMob2JqOiBhbnkpIHtcclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgdGhpcyBjYW4gc3RpbGwgaGFwcGVuLCBpdCBhcHByZWFkZWQgZHVyaW5nIGRldmVsb3BtZW50LiBtaWdodCBhbGVyYWR5IGJlIGZpeGVkXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3QuZW50cmllcyhvYmopLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgaW5zdGFuY2VvZiBGb3JtQXJyYXkgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBjb25zdCBmb3JtQXJyYXk6IEZvcm1BcnJheSA9IHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGFzIEZvcm1BcnJheTtcclxuXHJcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBjcmVhdGluZyBhIG5ldyBhcnJheSBldmVyeSB0aW1lIGFuZCBwdXNoIGEgbmV3IEZvcm1Db250cm9sXHJcbiAgICAgICAgLy8gd2UganVzdCByZW1vdmUgb3IgYWRkIHdoYXQgaXMgbmVjZXNzYXJ5IHNvIHRoYXQ6XHJcbiAgICAgICAgLy8gLSBpdCBpcyBhcyBlZmZpY2llbnQgYXMgcG9zc2libGUgYW5kIGRvIG5vdCBjcmVhdGUgdW5uZWNlc3NhcnkgRm9ybUNvbnRyb2wgZXZlcnkgdGltZVxyXG4gICAgICAgIC8vIC0gdmFsaWRhdG9ycyBhcmUgbm90IGRlc3Ryb3llZC9jcmVhdGVkIGFnYWluIGFuZCBldmVudHVhbGx5IGZpcmUgYWdhaW4gZm9yIG5vIHJlYXNvblxyXG4gICAgICAgIHdoaWxlIChmb3JtQXJyYXkubGVuZ3RoID4gdmFsdWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICBmb3JtQXJyYXkucmVtb3ZlQXQoZm9ybUFycmF5Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZvcm1BcnJheS5sZW5ndGg7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCkpIHtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCB0aGlzLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2woa2V5IGFzIEFycmF5UHJvcGVydHlLZXk8Rm9ybUludGVyZmFjZT4sIHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gbmV3IEZvcm1Db250cm9sKHZhbHVlW2ldKTtcclxuICAgICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbCh0aGlzLmZvcm1Hcm91cCwgY29udHJvbCk7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgY29udHJvbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCk6IHRoaXMgaXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB0eXBlb2YgKCh0aGlzIGFzIHVua25vd24pIGFzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPikuY3JlYXRlRm9ybUFycmF5Q29udHJvbCA9PT0gJ2Z1bmN0aW9uJztcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gY3VzdG9taXppbmcgdGhlIGVtaXNzaW9uIHJhdGUgb2YgeW91ciBzdWIgZm9ybSBjb21wb25lbnQsIHJlbWVtYmVyIG5vdCB0byAqKm11dGF0ZSoqIHRoZSBzdHJlYW1cclxuICAvLyBpdCBpcyBzYWZlIHRvIHRocm90dGxlLCBkZWJvdW5jZSwgZGVsYXksIGV0YyBidXQgdXNpbmcgc2tpcCwgZmlyc3QsIGxhc3Qgb3IgbXV0YXRpbmcgZGF0YSBpbnNpZGVcclxuICAvLyB0aGUgc3RyZWFtIHdpbGwgY2F1c2UgaXNzdWVzIVxyXG4gIHB1YmxpYyBoYW5kbGVFbWlzc2lvblJhdGUoKTogKG9icyQ6IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+KSA9PiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gb2JzJCA9PiBvYnMkO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChvYmogYXMgYW55KSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyBhbnkpIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgfVxyXG59XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT4gZXh0ZW5kcyBOZ3hTdWJGb3JtQ29tcG9uZW50PFxyXG4gIENvbnRyb2xJbnRlcmZhY2UsXHJcbiAgRm9ybUludGVyZmFjZVxyXG4+IHtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGw7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGw7XHJcbn1cclxuIl19