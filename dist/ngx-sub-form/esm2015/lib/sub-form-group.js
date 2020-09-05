import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray, } from '@angular/forms';
class CustomEventEmitter extends EventEmitter {
    setSubForm(subForm) {
        this.subForm = subForm;
    }
    emit(value) {
        // ignore all emit values until sub form tree is initialized
        if (!this.subForm) {
            return;
        }
        this.subForm.formGroup.updateValue({ self: true });
        super.emit(this.subForm.formGroup.controlValue);
    }
}
export class SubFormGroup extends FormGroup {
    constructor(value, validatorOrOpts, asyncValidator) {
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        super({});
        this.isRoot = false;
        // this is how to overwrite a propetotype property
        //   Object.defineProperty(foo, "bar", {
        //     // only returns odd die sides
        //     get: function () { return (Math.random() * 6) | 1; }
        // });
        this.controlValue = (value || undefined);
        this._valueChanges = new CustomEventEmitter();
        this.valueChanges = this._valueChanges;
        this.parentValidatorOrOpts = validatorOrOpts;
        this.parentAsyncValidator = asyncValidator;
    }
    setChangeDetector(cd) {
        this.cd = cd;
    }
    get value() {
        // if (!this.subForm) {
        //   return null;
        // }
        // const transformedValue = (this.transformFromFormGroup(
        //   (super.value as any) as TForm,
        // ) as unknown) as TControl;
        // return transformedValue;
        return this.controlValue;
    }
    // this method is being called from angular code only
    set value(value) {
        if (!this.subForm) {
            return;
        }
        const controlValue = this.transformFromFormGroup(value);
        this.controlValue = controlValue;
        // @ts-ignore
        super.value = controlValue;
        //const formValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;
        // TODO rethink as this might not work as we want it, we might not even need this anymore
        // @ts-ignore
        // (super.value as any) = formValue;
        //this.controlValue = value;
    }
    setSubForm(subForm) {
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        if (this.root === this) {
            this.isRoot = true;
        }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = (obj, defaultValues) => {
            return this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    }
    getRawValue() {
        const rawValue = super.getRawValue();
        return this.transformFromFormGroup(rawValue);
    }
    setValue(value, options = {}) {
        // this happens when the parent sets a value but the sub-form-component has not run ngChanges yet
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        this.controlValue = value;
        // TODO check if providing {} does work, as we do not want to override existing values with default values
        // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
        // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
        const formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.patchValue(formValue, options);
    }
    patchValue(value, options = {}) {
        // when value is null treat patch value as set value
        if (!value) {
            return this.setValue(value, options);
        }
        // this happens when the parent sets a value but the sub-form-component has not tun ngOnInit yet
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        this.controlValue = Object.assign(Object.assign({}, this.controlValue), value);
        // TODO check if providing {} does work, as we do not want to override existing values with default values
        // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
        // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
        const formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.patchValue(formValue, options);
    }
    reset(value, options = {}) {
        // reset is triggered from parent when formgroup is created
        // then again from sub-form inside ngOnInit after subForm was set
        // so when can safely ignore resets prior to subForm being set
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        const defaultValues = this.getDefaultValues();
        const defaultValuesAsControl = this.transformFromFormGroup(defaultValues);
        // if value is an array skip merging with default values
        if (Array.isArray(value) || Array.isArray(defaultValuesAsControl)) {
            this.controlValue = value;
        }
        else if (
        // in js null is also of type object
        // hence we need to check for null before checking if its of type object
        (value !== null && typeof value === 'object') ||
            (defaultValuesAsControl !== null && typeof defaultValuesAsControl === 'object')) {
            this.controlValue = Object.assign(Object.assign({}, defaultValuesAsControl), value);
        }
        else {
            this.controlValue = (value || defaultValuesAsControl);
        }
        const formValue = this.transformToFormGroup(this.controlValue, defaultValues);
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.reset(formValue, options);
    }
    getControlValue(control) {
        if (control instanceof SubFormGroup) {
            return control.controlValue;
        }
        else if (control instanceof SubFormArray) {
            return control.controls.map(arrayElementControl => this.getControlValue(arrayElementControl));
        }
        else {
            return control.value;
        }
    }
    updateValue(options) {
        var _a;
        if (!this.subForm) {
            return;
        }
        const formValue = {};
        for (const [key, value] of Object.entries(this.subForm.formGroup.controls)) {
            const control = value;
            formValue[key] = this.getControlValue(control);
        }
        const controlValue = this.transformFromFormGroup(formValue || {});
        this.controlValue = controlValue;
        // eith this is the root sub form or there is no root sub form
        if (((_a = options) === null || _a === void 0 ? void 0 : _a.self) || this.isRoot || !(this.parent instanceof SubFormGroup)) {
            return;
        }
        const parent = this.parent;
        parent.updateValue(options);
        //this.updateValueAndValidity(options);
    }
}
// this idea of this is that when a non sub form group is being updated the sub form group needs to be notifed
export function patchFormControl(subFormGroup, control) {
    const patchableControl = control;
    if (!patchableControl.isPatched) {
        const setValue = patchableControl.setValue.bind(patchableControl);
        patchableControl.setValue = (value, options) => {
            setValue(value, options);
            subFormGroup.updateValue(options);
        };
        patchableControl.isPatched = true;
    }
}
export class SubFormArray extends FormArray {
    constructor(subForm, controls, validatorOrOpts, asyncValidator) {
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        super(controls);
        this.isRoot = false;
        this._valueChanges = new CustomEventEmitter();
        this.valueChanges = this._valueChanges;
        this.parentValidatorOrOpts = validatorOrOpts;
        this.parentAsyncValidator = asyncValidator;
        this.setSubForm(subForm);
    }
    setSubForm(subForm) {
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        // for some reason root is not properly set for form array
        // on the other hand form array should never be root anyway so we can ignore thsi for now
        // if (this.root === this) {
        //   this.isRoot = true;
        // }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = (obj, defaultValues) => {
            return this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    }
    setValue(value, options) {
        super.setValue(value, options);
        this.subForm.formGroup.updateValue(options);
    }
    patchValue(value, options) {
        super.patchValue(value, options);
        this.subForm.formGroup.updateValue(options);
    }
    updateValue(options) {
        if (!this.subForm) {
            return;
        }
        this.parent.updateValue(options);
        //this.updateValueAndValidity(options);
    }
    removeAt(index) {
        super.removeAt(index);
        this.subForm.formGroup.updateValue(undefined);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUdMLFNBQVMsRUFHVCxTQUFTLEdBRVYsTUFBTSxnQkFBZ0IsQ0FBQztBQUl4QixNQUFNLGtCQUErQyxTQUFRLFlBQXNCO0lBR2pGLFVBQVUsQ0FBQyxPQUE2QztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxDQUFDLEtBQWdCO1FBQ25CLDREQUE0RDtRQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVuRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxZQUF5QyxTQUFRLFNBQVM7SUFjckUsWUFDRSxLQUErQixFQUMvQixlQUE2RSxFQUM3RSxjQUE2RDtRQUc3RCw0R0FBNEc7UUFDNUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBakJKLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxJQUFJLENB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SSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQVUsRUFBRSxPQUFZO1FBQy9CLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFVLEVBQUUsT0FBWTtRQUNqQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQTJDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBWTtRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFQSxJQUFJLENBQUMsTUFBYyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyx1Q0FBdUM7SUFDekMsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFhO1FBQ3BCLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIENoYW5nZURldGVjdG9yUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1Hcm91cCxcclxuICBWYWxpZGF0b3JGbixcclxuICBGb3JtQ29udHJvbCxcclxuICBGb3JtQXJyYXksXHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuXHJcbmltcG9ydCB7IE5neFN1YkZvcm1Db21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5cclxuY2xhc3MgQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEV2ZW50RW1pdHRlcjxUQ29udHJvbD4ge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgfVxyXG5cclxuICBlbWl0KHZhbHVlPzogVENvbnRyb2wpOiB2b2lkIHtcclxuICAgIC8vIGlnbm9yZSBhbGwgZW1pdCB2YWx1ZXMgdW50aWwgc3ViIGZvcm0gdHJlZSBpcyBpbml0aWFsaXplZFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAudXBkYXRlVmFsdWUoeyBzZWxmOiB0cnVlIH0pO1xyXG5cclxuICAgIHN1cGVyLmVtaXQodGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9sVmFsdWUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBGb3JtR3JvdXAge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgcHVibGljIGNkOiBDaGFuZ2VEZXRlY3RvclJlZiB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgcHVibGljIGNvbnRyb2xWYWx1ZSE6IFRDb250cm9sO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgdmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+IHwgbnVsbCxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICAgIC8vQE9wdGlvbmFsKCkgQEluamVjdChTVUJfRk9STV9DT01QT05FTlRfVE9LRU4pIHB1YmxpYyBwYXJlbnRTdWJGb3JtPzogTmd4U3ViRm9ybUNvbXBvbmVudDxhbnk+LFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcih7fSk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyBob3cgdG8gb3ZlcndyaXRlIGEgcHJvcGV0b3R5cGUgcHJvcGVydHlcclxuICAgIC8vICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZvbywgXCJiYXJcIiwge1xyXG4gICAgLy8gICAgIC8vIG9ubHkgcmV0dXJucyBvZGQgZGllIHNpZGVzXHJcbiAgICAvLyAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiAoTWF0aC5yYW5kb20oKSAqIDYpIHwgMTsgfVxyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgdW5kZWZpbmVkKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgQ3VzdG9tRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcbiAgfVxyXG5cclxuICBzZXRDaGFuZ2VEZXRlY3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHRoaXMuY2QgPSBjZDtcclxuICB9XHJcblxyXG4gIGdldCB2YWx1ZSgpIHtcclxuICAgIC8vIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAvLyAgIHJldHVybiBudWxsO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKFxyXG4gICAgLy8gICAoc3VwZXIudmFsdWUgYXMgYW55KSBhcyBURm9ybSxcclxuICAgIC8vICkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICAvLyByZXR1cm4gdHJhbnNmb3JtZWRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sVmFsdWU7XHJcbiAgfVxyXG5cclxuICAvLyB0aGlzIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQgZnJvbSBhbmd1bGFyIGNvZGUgb25seVxyXG4gIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBURm9ybSkgYXMgVENvbnRyb2w7XHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHJcbiAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAoc3VwZXIudmFsdWUgYXMgYW55KSA9IGNvbnRyb2xWYWx1ZTtcclxuICAgIC8vY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcbiAgICAvLyBUT0RPIHJldGhpbmsgYXMgdGhpcyBtaWdodCBub3Qgd29yayBhcyB3ZSB3YW50IGl0LCB3ZSBtaWdodCBub3QgZXZlbiBuZWVkIHRoaXMgYW55bW9yZVxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgLy8gKHN1cGVyLnZhbHVlIGFzIGFueSkgPSBmb3JtVmFsdWU7XHJcbiAgICAvL3RoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmF3VmFsdWUoKTogVENvbnRyb2wge1xyXG4gICAgY29uc3QgcmF3VmFsdWUgPSBzdXBlci5nZXRSYXdWYWx1ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChyYXdWYWx1ZSkgYXMgVENvbnRyb2w7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogVENvbnRyb2wsIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCBydW4gbmdDaGFuZ2VzIHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZShmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gd2hlbiB2YWx1ZSBpcyBudWxsIHRyZWF0IHBhdGNoIHZhbHVlIGFzIHNldCB2YWx1ZVxyXG4gICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCB0dW4gbmdPbkluaXQgeWV0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4udGhpcy5jb250cm9sVmFsdWUsIC4uLnZhbHVlIH07XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlc2V0KHZhbHVlPzogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gcmVzZXQgaXMgdHJpZ2dlcmVkIGZyb20gcGFyZW50IHdoZW4gZm9ybWdyb3VwIGlzIGNyZWF0ZWRcclxuICAgIC8vIHRoZW4gYWdhaW4gZnJvbSBzdWItZm9ybSBpbnNpZGUgbmdPbkluaXQgYWZ0ZXIgc3ViRm9ybSB3YXMgc2V0XHJcbiAgICAvLyBzbyB3aGVuIGNhbiBzYWZlbHkgaWdub3JlIHJlc2V0cyBwcmlvciB0byBzdWJGb3JtIGJlaW5nIHNldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpIGFzIFRGb3JtO1xyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChkZWZhdWx0VmFsdWVzKSBhcyBUQ29udHJvbDtcclxuICAgIC8vIGlmIHZhbHVlIGlzIGFuIGFycmF5IHNraXAgbWVyZ2luZyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgQXJyYXkuaXNBcnJheShkZWZhdWx0VmFsdWVzQXNDb250cm9sKSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgIC8vIGluIGpzIG51bGwgaXMgYWxzbyBvZiB0eXBlIG9iamVjdFxyXG4gICAgICAvLyBoZW5jZSB3ZSBuZWVkIHRvIGNoZWNrIGZvciBudWxsIGJlZm9yZSBjaGVja2luZyBpZiBpdHMgb2YgdHlwZSBvYmplY3RcclxuICAgICAgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHx8XHJcbiAgICAgIChkZWZhdWx0VmFsdWVzQXNDb250cm9sICE9PSBudWxsICYmIHR5cGVvZiBkZWZhdWx0VmFsdWVzQXNDb250cm9sID09PSAnb2JqZWN0JylcclxuICAgICkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4uZGVmYXVsdFZhbHVlc0FzQ29udHJvbCwgLi4udmFsdWUgfSBhcyBUQ29udHJvbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gKCh2YWx1ZSB8fCBkZWZhdWx0VmFsdWVzQXNDb250cm9sKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCh0aGlzLmNvbnRyb2xWYWx1ZSwgZGVmYXVsdFZhbHVlcykgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucmVzZXQoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0Q29udHJvbFZhbHVlKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IGFueSB7XHJcbiAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gY29udHJvbC5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2UgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtQXJyYXkpIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbHMubWFwKGFycmF5RWxlbWVudENvbnRyb2wgPT4gdGhpcy5nZXRDb250cm9sVmFsdWUoYXJyYXlFbGVtZW50Q29udHJvbCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wudmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVWYWx1ZShvcHRpb25zPzogeyBzZWxmPzogYm9vbGVhbiB9KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0ge30gYXMgYW55O1xyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9scykpIHtcclxuICAgICAgY29uc3QgY29udHJvbCA9IHZhbHVlIGFzIEFic3RyYWN0Q29udHJvbDtcclxuICAgICAgZm9ybVZhbHVlW2tleV0gPSB0aGlzLmdldENvbnRyb2xWYWx1ZShjb250cm9sKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZSB8fCAoe30gYXMgVEZvcm0pKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHJcbiAgICAvLyBlaXRoIHRoaXMgaXMgdGhlIHJvb3Qgc3ViIGZvcm0gb3IgdGhlcmUgaXMgbm8gcm9vdCBzdWIgZm9ybVxyXG4gICAgaWYgKG9wdGlvbnM/LnNlbGYgfHwgdGhpcy5pc1Jvb3QgfHwgISh0aGlzLnBhcmVudCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50IGFzIFN1YkZvcm1Hcm91cDxhbnksIGFueT4gfCBTdWJGb3JtQXJyYXk8YW55LCBhbnk+O1xyXG4gICAgcGFyZW50LnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0aGlzIGlkZWEgb2YgdGhpcyBpcyB0aGF0IHdoZW4gYSBub24gc3ViIGZvcm0gZ3JvdXAgaXMgYmVpbmcgdXBkYXRlZCB0aGUgc3ViIGZvcm0gZ3JvdXAgbmVlZHMgdG8gYmUgbm90aWZlZFxyXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hGb3JtQ29udHJvbDxUQ29udHJvbCwgVEZvcm0+KHN1YkZvcm1Hcm91cDogU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybT4sIGNvbnRyb2w6IEZvcm1Db250cm9sKSB7XHJcbiAgY29uc3QgcGF0Y2hhYmxlQ29udHJvbCA9IGNvbnRyb2wgYXMgRm9ybUNvbnRyb2wgJiB7IGlzUGF0Y2hlZDogYm9vbGVhbiB9O1xyXG5cclxuICBpZiAoIXBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkKSB7XHJcbiAgICBjb25zdCBzZXRWYWx1ZSA9IHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUuYmluZChwYXRjaGFibGVDb250cm9sKTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUgPSAodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSA9PiB7XHJcbiAgICAgIHNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICAgc3ViRm9ybUdyb3VwLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgfTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkID0gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtQXJyYXk8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUFycmF5IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICAvL3B1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbFtdO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+LFxyXG4gICAgY29udHJvbHM6IEFic3RyYWN0Q29udHJvbFtdLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcihjb250cm9scyk7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcblxyXG4gICAgdGhpcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICAvLyBmb3Igc29tZSByZWFzb24gcm9vdCBpcyBub3QgcHJvcGVybHkgc2V0IGZvciBmb3JtIGFycmF5XHJcbiAgICAvLyBvbiB0aGUgb3RoZXIgaGFuZCBmb3JtIGFycmF5IHNob3VsZCBuZXZlciBiZSByb290IGFueXdheSBzbyB3ZSBjYW4gaWdub3JlIHRoc2kgZm9yIG5vd1xyXG4gICAgLy8gaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgLy8gICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkge1xyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgKHRoaXMucGFyZW50IGFzIGFueSkudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlbW92ZUF0KGluZGV4KTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuIl19