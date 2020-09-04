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
        // if (!this.subForm) {
        //   return;
        // }
        // @ts-ignore
        super.value = value;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUdMLFNBQVMsRUFHVCxTQUFTLEdBRVYsTUFBTSxnQkFBZ0IsQ0FBQztBQUl4QixNQUFNLGtCQUErQyxTQUFRLFlBQXNCO0lBR2pGLFVBQVUsQ0FBQyxPQUE2QztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxDQUFDLEtBQWdCO1FBQ25CLDREQUE0RDtRQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVuRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxZQUF5QyxTQUFRLFNBQVM7SUFjckUsWUFDRSxLQUErQixFQUMvQixlQUE2RSxFQUM3RSxjQUE2RDtRQUc3RCw0R0FBNEc7UUFDNUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBakJKLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxJQUFJLENB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QUFDLENBQUM7SUFDOUUsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFVLEVBQUUsT0FBWTtRQUMvQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQTJDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBVSxFQUFFLE9BQVk7UUFDakMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQVk7UUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDakIsT0FBTztTQUNSO1FBRUEsSUFBSSxDQUFDLE1BQWMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsdUNBQXVDO0lBQ3pDLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBYTtRQUNwQixLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEYsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBDaGFuZ2VEZXRlY3RvclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtR3JvdXAsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgRm9ybUFycmF5LFxyXG4gIEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcblxyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50JztcclxuXHJcbmNsYXNzIEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBFdmVudEVtaXR0ZXI8VENvbnRyb2w+IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gIH1cclxuXHJcbiAgZW1pdCh2YWx1ZT86IFRDb250cm9sKTogdm9pZCB7XHJcbiAgICAvLyBpZ25vcmUgYWxsIGVtaXQgdmFsdWVzIHVudGlsIHN1YiBmb3JtIHRyZWUgaXMgaW5pdGlhbGl6ZWRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLnVwZGF0ZVZhbHVlKHsgc2VsZjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzdXBlci5lbWl0KHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbFZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUdyb3VwIHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBpc1Jvb3QgPSBmYWxzZTtcclxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHB1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbDtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHZhbHVlOiBQYXJ0aWFsPFRDb250cm9sPiB8IG51bGwsXHJcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCxcclxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwsXHJcbiAgICAvL0BPcHRpb25hbCgpIEBJbmplY3QoU1VCX0ZPUk1fQ09NUE9ORU5UX1RPS0VOKSBwdWJsaWMgcGFyZW50U3ViRm9ybT86IE5neFN1YkZvcm1Db21wb25lbnQ8YW55PixcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoe30pO1xyXG5cclxuICAgIC8vIHRoaXMgaXMgaG93IHRvIG92ZXJ3cml0ZSBhIHByb3BldG90eXBlIHByb3BlcnR5XHJcbiAgICAvLyAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmb28sIFwiYmFyXCIsIHtcclxuICAgIC8vICAgICAvLyBvbmx5IHJldHVybnMgb2RkIGRpZSBzaWRlc1xyXG4gICAgLy8gICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKE1hdGgucmFuZG9tKCkgKiA2KSB8IDE7IH1cclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gKHZhbHVlIHx8IHVuZGVmaW5lZCkgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG5cclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG4gIH1cclxuXHJcbiAgc2V0Q2hhbmdlRGV0ZWN0b3IoY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XHJcbiAgICB0aGlzLmNkID0gY2Q7XHJcbiAgfVxyXG5cclxuICBnZXQgdmFsdWUoKSB7XHJcbiAgICAvLyBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgLy8gICByZXR1cm4gbnVsbDtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChcclxuICAgIC8vICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgYXMgVEZvcm0sXHJcbiAgICAvLyApIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgLy8gcmV0dXJuIHRyYW5zZm9ybWVkVmFsdWU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhpcyBtZXRob2QgaXMgYmVpbmcgY2FsbGVkIGZyb20gYW5ndWxhciBjb2RlIG9ubHlcclxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgLy8gaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgIC8vICAgcmV0dXJuO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIChzdXBlci52YWx1ZSBhcyBhbnkpID0gdmFsdWU7XHJcbiAgICAvL2NvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG4gICAgLy8gVE9ETyByZXRoaW5rIGFzIHRoaXMgbWlnaHQgbm90IHdvcmsgYXMgd2Ugd2FudCBpdCwgd2UgbWlnaHQgbm90IGV2ZW4gbmVlZCB0aGlzIGFueW1vcmVcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIC8vIChzdXBlci52YWx1ZSBhcyBhbnkpID0gZm9ybVZhbHVlO1xyXG4gICAgLy90aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICBpZiAodGhpcy5yb290ID09PSB0aGlzKSB7XHJcbiAgICAgIHRoaXMuaXNSb290ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0cmFuc2Zvcm0gdG8gZm9ybSBncm91cCBzaG91bGQgbmV2ZXIgcmV0dXJuIG51bGwgLyB1bmRlZmluZWQgYnV0IHt9IGluc3RlYWRcclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIGdldFJhd1ZhbHVlKCk6IFRDb250cm9sIHtcclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gc3VwZXIuZ2V0UmF3VmFsdWUoKTtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAocmF3VmFsdWUpIGFzIFRDb250cm9sO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IFRDb250cm9sLCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgcnVuIG5nQ2hhbmdlcyB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHBhdGNoVmFsdWUodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHdoZW4gdmFsdWUgaXMgbnVsbCB0cmVhdCBwYXRjaCB2YWx1ZSBhcyBzZXQgdmFsdWVcclxuICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0VmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZXNldCh2YWx1ZT86IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHJlc2V0IGlzIHRyaWdnZXJlZCBmcm9tIHBhcmVudCB3aGVuIGZvcm1ncm91cCBpcyBjcmVhdGVkXHJcbiAgICAvLyB0aGVuIGFnYWluIGZyb20gc3ViLWZvcm0gaW5zaWRlIG5nT25Jbml0IGFmdGVyIHN1YkZvcm0gd2FzIHNldFxyXG4gICAgLy8gc28gd2hlbiBjYW4gc2FmZWx5IGlnbm9yZSByZXNldHMgcHJpb3IgdG8gc3ViRm9ybSBiZWluZyBzZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWUgYXMgVENvbnRyb2w7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKSBhcyBURm9ybTtcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcykgYXMgVENvbnRyb2w7XHJcbiAgICAvLyBpZiB2YWx1ZSBpcyBhbiBhcnJheSBza2lwIG1lcmdpbmcgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IEFycmF5LmlzQXJyYXkoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkpIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAvLyBpbiBqcyBudWxsIGlzIGFsc28gb2YgdHlwZSBvYmplY3RcclxuICAgICAgLy8gaGVuY2Ugd2UgbmVlZCB0byBjaGVjayBmb3IgbnVsbCBiZWZvcmUgY2hlY2tpbmcgaWYgaXRzIG9mIHR5cGUgb2JqZWN0XHJcbiAgICAgICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB8fFxyXG4gICAgICAoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCA9PT0gJ29iamVjdCcpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLmRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wsIC4uLnZhbHVlIH0gYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICgodmFsdWUgfHwgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAodGhpcy5jb250cm9sVmFsdWUsIGRlZmF1bHRWYWx1ZXMpIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnJlc2V0KGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldENvbnRyb2xWYWx1ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBhbnkge1xyXG4gICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUFycmF5KSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLmNvbnRyb2xzLm1hcChhcnJheUVsZW1lbnRDb250cm9sID0+IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGFycmF5RWxlbWVudENvbnRyb2wpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLnZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9ucz86IHsgc2VsZj86IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHt9IGFzIGFueTtcclxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbHMpKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2wgPSB2YWx1ZSBhcyBBYnN0cmFjdENvbnRyb2w7XHJcbiAgICAgIGZvcm1WYWx1ZVtrZXldID0gdGhpcy5nZXRDb250cm9sVmFsdWUoY29udHJvbCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWUgfHwgKHt9IGFzIFRGb3JtKSkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblxyXG4gICAgLy8gZWl0aCB0aGlzIGlzIHRoZSByb290IHN1YiBmb3JtIG9yIHRoZXJlIGlzIG5vIHJvb3Qgc3ViIGZvcm1cclxuICAgIGlmIChvcHRpb25zPy5zZWxmIHx8IHRoaXMuaXNSb290IHx8ICEodGhpcy5wYXJlbnQgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudCBhcyBTdWJGb3JtR3JvdXA8YW55LCBhbnk+IHwgU3ViRm9ybUFycmF5PGFueSwgYW55PjtcclxuICAgIHBhcmVudC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIC8vdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdGlvbnMpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGhpcyBpZGVhIG9mIHRoaXMgaXMgdGhhdCB3aGVuIGEgbm9uIHN1YiBmb3JtIGdyb3VwIGlzIGJlaW5nIHVwZGF0ZWQgdGhlIHN1YiBmb3JtIGdyb3VwIG5lZWRzIHRvIGJlIG5vdGlmZWRcclxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRm9ybUNvbnRyb2w8VENvbnRyb2wsIFRGb3JtPihzdWJGb3JtR3JvdXA6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+LCBjb250cm9sOiBGb3JtQ29udHJvbCkge1xyXG4gIGNvbnN0IHBhdGNoYWJsZUNvbnRyb2wgPSBjb250cm9sIGFzIEZvcm1Db250cm9sICYgeyBpc1BhdGNoZWQ6IGJvb2xlYW4gfTtcclxuXHJcbiAgaWYgKCFwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCkge1xyXG4gICAgY29uc3Qgc2V0VmFsdWUgPSBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlLmJpbmQocGF0Y2hhYmxlQ29udHJvbCk7XHJcbiAgICBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlID0gKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgICBzZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgIHN1YkZvcm1Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIH07XHJcbiAgICBwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUFycmF5PFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1BcnJheSB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgLy9wdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2xbXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPixcclxuICAgIGNvbnRyb2xzOiBBYnN0cmFjdENvbnRyb2xbXSxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoY29udHJvbHMpO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG5cclxuICAgIHRoaXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcblxyXG4gICAgLy8gZm9yIHNvbWUgcmVhc29uIHJvb3QgaXMgbm90IHByb3Blcmx5IHNldCBmb3IgZm9ybSBhcnJheVxyXG4gICAgLy8gb24gdGhlIG90aGVyIGhhbmQgZm9ybSBhcnJheSBzaG91bGQgbmV2ZXIgYmUgcm9vdCBhbnl3YXkgc28gd2UgY2FuIGlnbm9yZSB0aHNpIGZvciBub3dcclxuICAgIC8vIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgIC8vICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICBzdXBlci5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgKCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwIGFzIHVua25vd24pIGFzIFN1YkZvcm1Hcm91cDxhbnk+KS51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgICh0aGlzLnBhcmVudCBhcyBhbnkpLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVBdChpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVBdChpbmRleCk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==