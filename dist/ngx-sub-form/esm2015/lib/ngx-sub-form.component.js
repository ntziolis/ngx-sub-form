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
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if (this.formGroup.cd) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFrUTFDLENBQUM7SUE3UEMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVFLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLFlBQVksWUFBWSxD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LENBQUMsU0FBd0I7UUFDdkQsT0FBUSxTQUFxQyxDQUFDO0lBQ2hELENBQUM7Q0FDRixDQUFBO0FBclFtQjtJQUFqQixLQUFLLENBQUMsU0FBUyxDQUFDOztzREFBZ0U7QUFQN0QsbUJBQW1CO0lBRnhDLFNBQVMsRUFBRTtJQUNaLG1EQUFtRDtHQUM3QixtQkFBbUIsQ0E0UXhDO1NBNVFxQixtQkFBbUI7QUFnUnpDLElBQXNCLHdCQUF3QjtBQUQ5QyxtREFBbUQ7QUFDbkQsTUFBc0Isd0JBQTBELFNBQVEsbUJBR3ZGO0NBTUEsQ0FBQTtBQVRxQix3QkFBd0I7SUFGN0MsU0FBUyxFQUFFO0lBQ1osbURBQW1EO0dBQzdCLHdCQUF3QixDQVM3QztTQVRxQix3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlckNvbnRlbnRDaGVja2VkLCBEaXJlY3RpdmUsIElucHV0LCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1BcnJheSxcclxuICBGb3JtQ29udHJvbCxcclxuICBWYWxpZGF0b3JGbixcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuXHJcbmltcG9ydCB7IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3IsIGNvZXJjZVRvVmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdC1jb250cm9sLXV0aWxzJztcclxuaW1wb3J0IHtcclxuICBBcnJheVByb3BlcnR5S2V5LFxyXG4gIENvbnRyb2xNYXAsXHJcbiAgQ29udHJvbHMsXHJcbiAgQ29udHJvbHNOYW1lcyxcclxuICBDb250cm9sc1R5cGUsXHJcbiAgaXNOdWxsT3JVbmRlZmluZWQsXHJcbiAgVHlwZWRBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5pbXBvcnQgeyBGb3JtR3JvdXBPcHRpb25zLCBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHMsIFR5cGVkU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0udHlwZXMnO1xyXG5pbXBvcnQgeyBwYXRjaEZvcm1Db250cm9sLCBTdWJGb3JtR3JvdXAgfSBmcm9tICcuL3N1Yi1mb3JtLWdyb3VwJztcclxuXHJcbnR5cGUgTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPiA9IChjdHJsOiBBYnN0cmFjdENvbnRyb2wsIGtleToga2V5b2YgRm9ybUludGVyZmFjZSkgPT4gTWFwVmFsdWU7XHJcbnR5cGUgRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKFxyXG4gIGN0cmw6IFR5cGVkQWJzdHJhY3RDb250cm9sPGFueT4sXHJcbiAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlLFxyXG4gIGlzQ3RybFdpdGhpbkZvcm1BcnJheTogYm9vbGVhbixcclxuKSA9PiBib29sZWFuO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50Q2hlY2tlZCB7XHJcbiAgLy8gd2hlbiBkZXZlbG9waW5nIHRoZSBsaWIgaXQncyBhIGdvb2QgaWRlYSB0byBzZXQgdGhlIGZvcm1Hcm91cCB0eXBlXHJcbiAgLy8gdG8gY3VycmVudCArIGB8IHVuZGVmaW5lZGAgdG8gY2F0Y2ggYSBidW5jaCBvZiBwb3NzaWJsZSBpc3N1ZXNcclxuICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWRcclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1pbnB1dC1yZW5hbWVcclxuICBASW5wdXQoJ3N1YkZvcm0nKSBmb3JtR3JvdXAhOiBUeXBlZFN1YkZvcm1Hcm91cDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHJvdGVjdGVkIGVtaXROdWxsT25EZXN0cm95ID0gdHJ1ZTtcclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IHRydWU7XHJcblxyXG4gIC8vIGNhbid0IGRlZmluZSB0aGVtIGRpcmVjdGx5XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEZvcm1Db250cm9scygpOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHVibGljIGdldCBmb3JtQ29udHJvbE5hbWVzKCk6IENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkIGZvciBhcyBzeW50YXhcclxuICAgIHJldHVybiB0aGlzLm1hcENvbnRyb2xzKFxyXG4gICAgICAoXywga2V5KSA9PiBrZXksXHJcbiAgICAgICgpID0+IHRydWUsXHJcbiAgICAgIGZhbHNlLFxyXG4gICAgKSBhcyBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+O1xyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgaWYgKGNoYW5nZXNbJ2RhdGFJbnB1dCddID09PSB1bmRlZmluZWQgJiYgY2hhbmdlc1snZm9ybUdyb3VwJ10gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEodGhpcy5mb3JtR3JvdXAgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgbmVlZHMgdG8gYmUgb2YgdHlwZSBTdWJGb3JtR3JvdXAuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmtleXModGhpcy5mb3JtR3JvdXAuY29udHJvbHMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAucmVtb3ZlQ29udHJvbChrZXkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3ViRm9ybSA9IHRoaXMuZm9ybUdyb3VwO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5nZXRGb3JtQ29udHJvbHMoKTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbnRyb2xzKSB7XHJcbiAgICAgIGlmIChjb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gd2lyZSB1cCB0aGUgZm9ybSBjb250cm9scyB3aXRoIHRoZSBzdWIgZm9ybSBncm91cFxyXG4gICAgICAgIC8vIHRoaXMgYWxsb3dzIHVzIHRvIHRyYW5zZm9ybSB0aGUgc3ViIGZvcm0gdmFsdWUgdG8gQ29udHJvbEludGVyZmFjZVxyXG4gICAgICAgIC8vIGV2ZXJ5IHRpbWUgYW55IG9mIHRoZSBmb3JtIGNvbnRyb2xzIG9uIHRoZSBzdWIgZm9ybSBjaGFuZ2VcclxuICAgICAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIEZvcm1Db250cm9sKSB7XHJcbiAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHN1YkZvcm0sIGNvbnRyb2wpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuYWRkQ29udHJvbChrZXksIGNvbnRyb2wpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29ubmVjdCBzdWIgZm9ybSBncm91cCB3aXRoIGN1cnJlbnQgc3ViLWZvcm0tY29tcG9uZW50XHJcbiAgICBzdWJGb3JtLnNldFN1YkZvcm0odGhpcyk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKSBhcyBBYnN0cmFjdENvbnRyb2xPcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHZhbGlkYXRvcnM6IFZhbGlkYXRvckZuW10gPSBbXTtcclxuICAgIGNvbnN0IGFzeW5jVmFsaWRhdG9yczogQXN5bmNWYWxpZGF0b3JGbltdID0gW107XHJcblxyXG4gICAgLy8gZ2V0IHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBnZXQgYXN5bmMgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcik7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGFuZGxlIEFic3RyYWN0Q29udHJvbE9wdGlvbnMgZnJvbSBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9uc1xyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgaWYgKG9wdGlvbnMudXBkYXRlT24pIHtcclxuICAgICAgICAvLyBzYWRseSB0aGVyZSBpcyBubyBwdWJsaWMgbWV0b2hkIHRoYXQgbGV0cyB1cyBjaGFuZ2UgdGhlIHVwZGF0ZSBzdHJhdGVneSBvZiBhbiBhbHJlYWR5IGNyZWF0ZWQgRm9ybUdyb3VwXHJcbiAgICAgICAgKHRoaXMuZm9ybUdyb3VwIGFzIGFueSkuX3NldFVwZGF0ZVN0cmF0ZWd5KG9wdGlvbnMudXBkYXRlT24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Iob3B0aW9ucy52YWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLmFzeW5jVmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Iob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHZhbGlkYXRvcnMgLyBhc3luYyB2YWxpZGF0b3JzIG9uIHN1YiBmb3JtIGdyb3VwXHJcbiAgICBpZiAodmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldFZhbGlkYXRvcnModmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXN5bmNWYWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0QXN5bmNWYWxpZGF0b3JzKGFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgdGhlIGZvcm0gaGFzIGRlZmF1bHQgdmFsdWVzLCB0aGV5IHNob3VsZCBiZSBhcHBsaWVkIHN0cmFpZ2h0IGF3YXlcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCk7XHJcblxyXG4gICAgLy8gZ2V0IGRlZmF1bHQgdmFsdWVzIGZvciByZXNldCwgaWYgbnVsbCBmYWxsYmFjayB0byB1bmRlZmluZWQgYXMgdGhlcmUgc2kgYSBkaWZmZXJlbmNlIHdoZW4gY2FsbGluZyByZXNldFxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChkZWZhdWx0VmFsdWVzIGFzIEZvcm1JbnRlcmZhY2UpIHx8IHVuZGVmaW5lZDtcclxuICAgIC8vIHNpbmNlIHRoaXMgaXMgdGhlIGluaXRpYWwgc2V0dGluZyBvZiBmb3JtIHZhbHVlcyBkbyBOT1QgZW1pdCBhbiBldmVudFxyXG5cclxuICAgIGxldCBtZXJnZWRWYWx1ZXM6IENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmFuc2Zvcm1lZFZhbHVlKSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSBzdWJGb3JtLmNvbnRyb2xWYWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IChjaGFuZ2VzWydkYXRhSW5wdXQnXSA/ICh0aGlzIGFzIGFueSlbJ2RhdGFJbnB1dCddIDogc3ViRm9ybS5jb250cm9sVmFsdWUpIHx8IHt9O1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSB7IC4uLnRyYW5zZm9ybWVkVmFsdWUsIC4uLmNvbnRyb2xWYWx1ZSB9IGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChtZXJnZWRWYWx1ZXMsIHt9KTtcclxuICAgIHRoaXMuaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICAvLyBzZWxmID0gZmFsc2UgaXMgY3JpdGljYWwgaGVyZVxyXG4gICAgLy8gdGhpcyBhbGxvd3MgdGhlIHBhcmVudCBmb3JtIHRvIHJlLWV2YWx1YXRlIGl0cyBzdGF0dXMgYWZ0ZXIgZWFjaCBvZiBpdHMgc3ViIGZvcm0gaGFzIGNvbXBsZXRlZCBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB3ZSBhY3R1YWxseSBvbmx5IG5lZWQgdG8gY2FsbCB0aGlzIG9uIHRoZSBkZWVwZXN0IHN1YiBmb3JtIGluIGEgdHJlZSAobGVhdmVzKVxyXG4gICAgLy8gYnV0IHRoZXJlIGlzIG5vIHdheSB0byBpZGVudGlmeSBpZiB0aGVyZSBhcmUgc3ViIGZvcm1zIG9uIHRoZSBjdXJyZW50IGZvcm0gKyB0aGF0IGFyZSBhbHNvIHJlbmRlcmVkXHJcbiAgICAvLyBhcyBvbmx5IHdoZW4gc3ViIGZvcm1zIGFyZSByZW5kZXJlZCB0aGUgb24gY2hhbmdlcyBtZXRob2Qgb24gdGhlIHN1YiBmb3JtIGlzIGV4ZWN1dGVkXHJcblxyXG4gICAgLy8gVE9ETyBkZWNpZGUgaWYgd2Ugd2FudCB0byBlbWl0IGFuIGV2ZW50IHdoZW4gaW5wdXQgY29udHJvbCB2YWx1ZSAhPSBjb250cm9sIHZhbHVlIGFmdGVyIGludGlhbGl6YXRpb25cclxuICAgIC8vIHRoaXMgaGFwcGVucyBmb3IgZXhhbXBsZSB3aGVuIG51bGwgaXMgcGFzc2VkIGluIGJ1dCBkZWZhdWx0IHZhbHVlcyBjaGFuZ2UgdGhlIHZhbHVlIG9mIHRoZSBpbm5lciBmb3JtXHJcbiAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChtZXJnZWRWYWx1ZXMsIHsgb25seVNlbGY6IGZhbHNlLCBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyB0aGlzIHJ1bnMgdG9vIG9mdGVuLCBmaW5kIG91dCBvZiB0aGlzIGNhbiBiZSB0cmlnZ2VyZWQgZGlmZmVyZW50bHlcclxuICAgIC8vIGNoZWNraW5nIGlmIHRoZSBmb3JtIGdyb3VwIGhhcyBhIGNoYW5nZSBkZXRlY3RvciAocm9vdCBmb3JtcyBtaWdodCBub3QpXHJcbiAgICBpZiAodGhpcy5mb3JtR3JvdXAuY2QpIHtcclxuICAgICAgLy8gaWYgdGhpcyBpcyB0aGUgcm9vdCBmb3JtXHJcbiAgICAgIC8vIE9SIGlmIGlzdCBhIHN1YiBmb3JtIGJ1dCB0aGUgcm9vdCBmb3JtIGRvZXMgbm90IGhhdmUgYSBjaGFuZ2UgZGV0ZWN0b3JcclxuICAgICAgLy8gd2UgbmVlZCB0byBhY3R1YWxseSBydW4gY2hhbmdlIGRldGVjdGlvbiB2cyBqdXN0IG1hcmtpbmcgZm9yIGNoZWNrXHJcbiAgICAgIGlmICghdGhpcy5mb3JtR3JvdXAucGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuY2QuZGV0ZWN0Q2hhbmdlcygpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4sXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICk6IENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKCkgPT4gdHJ1ZSxcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4gPSB0cnVlLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGwge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtQ29udHJvbHM6IENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPiA9IHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBmb3JtQ29udHJvbHMpIHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybUNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIGlmIChyZWN1cnNpdmVJZkFycmF5ICYmIGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQXJyYXkpIHtcclxuICAgICAgICAgIGNvbnN0IHZhbHVlczogTWFwVmFsdWVbXSA9IFtdO1xyXG5cclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udHJvbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXksIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWVzLnB1c2gobWFwQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCAmJiB2YWx1ZXMuc29tZSh4ID0+ICFpc051bGxPclVuZGVmaW5lZCh4KSkpIHtcclxuICAgICAgICAgICAgY29udHJvbHNba2V5XSA9IHZhbHVlcztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRyb2wgJiYgZmlsdGVyQ29udHJvbChjb250cm9sLCBrZXksIGZhbHNlKSkge1xyXG4gICAgICAgICAgY29udHJvbHNba2V5XSA9IG1hcENvbnRyb2woY29udHJvbCwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29udHJvbHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRlbmQgdGhpcyBtZXRob2QgdG8gcHJvdmlkZSBjdXN0b20gbG9jYWwgRm9ybUdyb3VwIGxldmVsIHZhbGlkYXRpb25cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKTogRm9ybUdyb3VwT3B0aW9uczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGdldERlZmF1bHRWYWx1ZXMgaXMgZGVmaW5lZCwgeW91IGRvIG5vdCBuZWVkIHRvIHNwZWNpZnkgdGhlIGRlZmF1bHQgdmFsdWVzXHJcbiAgLy8gaW4geW91ciBmb3JtICh0aGUgb25lcyBkZWZpbmVkIHdpdGhpbiB0aGUgYGdldEZvcm1Db250cm9sc2AgbWV0aG9kKVxyXG4gIHByb3RlY3RlZCBnZXREZWZhdWx0VmFsdWVzKCk6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKG9iajogYW55KSB7XHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHRoaXMgY2FuIHN0aWxsIGhhcHBlbiwgaXQgYXBwcmVhZGVkIGR1cmluZyBkZXZlbG9wbWVudC4gbWlnaHQgYWxlcmFkeSBiZSBmaXhlZFxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGluc3RhbmNlb2YgRm9ybUFycmF5ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3QgZm9ybUFycmF5OiBGb3JtQXJyYXkgPSB0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBhcyBGb3JtQXJyYXk7XHJcblxyXG4gICAgICAgIC8vIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgYXJyYXkgZXZlcnkgdGltZSBhbmQgcHVzaCBhIG5ldyBGb3JtQ29udHJvbFxyXG4gICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlIG9yIGFkZCB3aGF0IGlzIG5lY2Vzc2FyeSBzbyB0aGF0OlxyXG4gICAgICAgIC8vIC0gaXQgaXMgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlIGFuZCBkbyBub3QgY3JlYXRlIHVubmVjZXNzYXJ5IEZvcm1Db250cm9sIGV2ZXJ5IHRpbWVcclxuICAgICAgICAvLyAtIHZhbGlkYXRvcnMgYXJlIG5vdCBkZXN0cm95ZWQvY3JlYXRlZCBhZ2FpbiBhbmQgZXZlbnR1YWxseSBmaXJlIGFnYWluIGZvciBubyByZWFzb25cclxuICAgICAgICB3aGlsZSAoZm9ybUFycmF5Lmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGZvcm1BcnJheS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmb3JtQXJyYXkubGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICh0aGlzLmZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpKSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgdGhpcy5jcmVhdGVGb3JtQXJyYXlDb250cm9sKGtleSBhcyBBcnJheVByb3BlcnR5S2V5PEZvcm1JbnRlcmZhY2U+LCB2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSk7XHJcbiAgICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2wodGhpcy5mb3JtR3JvdXAsIGNvbnRyb2wpO1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIGNvbnRyb2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGN1c3RvbWl6aW5nIHRoZSBlbWlzc2lvbiByYXRlIG9mIHlvdXIgc3ViIGZvcm0gY29tcG9uZW50LCByZW1lbWJlciBub3QgdG8gKiptdXRhdGUqKiB0aGUgc3RyZWFtXHJcbiAgLy8gaXQgaXMgc2FmZSB0byB0aHJvdHRsZSwgZGVib3VuY2UsIGRlbGF5LCBldGMgYnV0IHVzaW5nIHNraXAsIGZpcnN0LCBsYXN0IG9yIG11dGF0aW5nIGRhdGEgaW5zaWRlXHJcbiAgLy8gdGhlIHN0cmVhbSB3aWxsIGNhdXNlIGlzc3VlcyFcclxuICBwdWJsaWMgaGFuZGxlRW1pc3Npb25SYXRlKCk6IChvYnMkOiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPikgPT4gT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIGFueSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxufVxyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+IGV4dGVuZHMgTmd4U3ViRm9ybUNvbXBvbmVudDxcclxuICBDb250cm9sSW50ZXJmYWNlLFxyXG4gIEZvcm1JbnRlcmZhY2VcclxuPiB7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsO1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsO1xyXG59XHJcbiJdfQ==