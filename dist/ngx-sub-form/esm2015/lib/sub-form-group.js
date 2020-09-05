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
        const controlValue = this._reduceValue();
        this.controlValue = controlValue;
        // eith this is the root sub form or there is no root sub form
        if (((_a = options) === null || _a === void 0 ? void 0 : _a.self) || this.isRoot || !(this.parent instanceof SubFormGroup)) {
            return;
        }
        const parent = this.parent;
        parent.updateValue(options);
        //this.updateValueAndValidity(options);
    }
    _reduceValue() {
        if (!this.subForm) {
            return null;
        }
        const formValue = {};
        for (const [key, value] of Object.entries(this.subForm.formGroup.controls)) {
            const control = value;
            formValue[key] = this.getControlValue(control);
        }
        const controlValue = this.transformFromFormGroup(formValue || {});
        return controlValue;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUdMLFNBQVMsRUFHVCxTQUFTLEdBRVYsTUFBTSxnQkFBZ0IsQ0FBQztBQUl4QixNQUFNLGtCQUErQyxTQUFRLFlBQXNCO0lBR2pGLFVBQVUsQ0FBQyxPQUE2QztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxDQUFDLEtBQWdCO1FBQ25CLDREQUE0RDtRQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVuRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxZQUF5QyxTQUFRLFNBQVM7SUFjckUsWUFDRSxLQUErQixFQUMvQixlQUE2RSxFQUM3RSxjQUE2RDtRQUc3RCw0R0FBNEc7UUFDNUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBakJKLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxJQUFJLENB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IHsgRXZlbnRFbWl0dGVyLCBDaGFuZ2VEZXRlY3RvclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtR3JvdXAsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgRm9ybUFycmF5LFxyXG4gIEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcblxyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50JztcclxuXHJcbmNsYXNzIEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBFdmVudEVtaXR0ZXI8VENvbnRyb2w+IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gIH1cclxuXHJcbiAgZW1pdCh2YWx1ZT86IFRDb250cm9sKTogdm9pZCB7XHJcbiAgICAvLyBpZ25vcmUgYWxsIGVtaXQgdmFsdWVzIHVudGlsIHN1YiBmb3JtIHRyZWUgaXMgaW5pdGlhbGl6ZWRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLnVwZGF0ZVZhbHVlKHsgc2VsZjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzdXBlci5lbWl0KHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbFZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUdyb3VwIHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBpc1Jvb3QgPSBmYWxzZTtcclxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHB1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbDtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHZhbHVlOiBQYXJ0aWFsPFRDb250cm9sPiB8IG51bGwsXHJcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCxcclxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwsXHJcbiAgICAvL0BPcHRpb25hbCgpIEBJbmplY3QoU1VCX0ZPUk1fQ09NUE9ORU5UX1RPS0VOKSBwdWJsaWMgcGFyZW50U3ViRm9ybT86IE5neFN1YkZvcm1Db21wb25lbnQ8YW55PixcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoe30pO1xyXG5cclxuICAgIC8vIHRoaXMgaXMgaG93IHRvIG92ZXJ3cml0ZSBhIHByb3BldG90eXBlIHByb3BlcnR5XHJcbiAgICAvLyAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmb28sIFwiYmFyXCIsIHtcclxuICAgIC8vICAgICAvLyBvbmx5IHJldHVybnMgb2RkIGRpZSBzaWRlc1xyXG4gICAgLy8gICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKE1hdGgucmFuZG9tKCkgKiA2KSB8IDE7IH1cclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gKHZhbHVlIHx8IHVuZGVmaW5lZCkgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG5cclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG4gIH1cclxuXHJcbiAgc2V0Q2hhbmdlRGV0ZWN0b3IoY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XHJcbiAgICB0aGlzLmNkID0gY2Q7XHJcbiAgfVxyXG5cclxuICBnZXQgdmFsdWUoKSB7XHJcbiAgICAvLyBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgLy8gICByZXR1cm4gbnVsbDtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChcclxuICAgIC8vICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgYXMgVEZvcm0sXHJcbiAgICAvLyApIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgLy8gcmV0dXJuIHRyYW5zZm9ybWVkVmFsdWU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhpcyBtZXRob2QgaXMgYmVpbmcgY2FsbGVkIGZyb20gYW5ndWxhciBjb2RlIG9ubHlcclxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVEZvcm0pIGFzIFRDb250cm9sO1xyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgPSBjb250cm9sVmFsdWU7XHJcbiAgICAvL2NvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG4gICAgLy8gVE9ETyByZXRoaW5rIGFzIHRoaXMgbWlnaHQgbm90IHdvcmsgYXMgd2Ugd2FudCBpdCwgd2UgbWlnaHQgbm90IGV2ZW4gbmVlZCB0aGlzIGFueW1vcmVcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIC8vIChzdXBlci52YWx1ZSBhcyBhbnkpID0gZm9ybVZhbHVlO1xyXG4gICAgLy90aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICBpZiAodGhpcy5yb290ID09PSB0aGlzKSB7XHJcbiAgICAgIHRoaXMuaXNSb290ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0cmFuc2Zvcm0gdG8gZm9ybSBncm91cCBzaG91bGQgbmV2ZXIgcmV0dXJuIG51bGwgLyB1bmRlZmluZWQgYnV0IHt9IGluc3RlYWRcclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIGdldFJhd1ZhbHVlKCk6IFRDb250cm9sIHtcclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gc3VwZXIuZ2V0UmF3VmFsdWUoKTtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAocmF3VmFsdWUpIGFzIFRDb250cm9sO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IFRDb250cm9sLCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgcnVuIG5nQ2hhbmdlcyB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHBhdGNoVmFsdWUodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHdoZW4gdmFsdWUgaXMgbnVsbCB0cmVhdCBwYXRjaCB2YWx1ZSBhcyBzZXQgdmFsdWVcclxuICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0VmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZXNldCh2YWx1ZT86IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHJlc2V0IGlzIHRyaWdnZXJlZCBmcm9tIHBhcmVudCB3aGVuIGZvcm1ncm91cCBpcyBjcmVhdGVkXHJcbiAgICAvLyB0aGVuIGFnYWluIGZyb20gc3ViLWZvcm0gaW5zaWRlIG5nT25Jbml0IGFmdGVyIHN1YkZvcm0gd2FzIHNldFxyXG4gICAgLy8gc28gd2hlbiBjYW4gc2FmZWx5IGlnbm9yZSByZXNldHMgcHJpb3IgdG8gc3ViRm9ybSBiZWluZyBzZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWUgYXMgVENvbnRyb2w7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKSBhcyBURm9ybTtcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcykgYXMgVENvbnRyb2w7XHJcbiAgICAvLyBpZiB2YWx1ZSBpcyBhbiBhcnJheSBza2lwIG1lcmdpbmcgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IEFycmF5LmlzQXJyYXkoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkpIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAvLyBpbiBqcyBudWxsIGlzIGFsc28gb2YgdHlwZSBvYmplY3RcclxuICAgICAgLy8gaGVuY2Ugd2UgbmVlZCB0byBjaGVjayBmb3IgbnVsbCBiZWZvcmUgY2hlY2tpbmcgaWYgaXRzIG9mIHR5cGUgb2JqZWN0XHJcbiAgICAgICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB8fFxyXG4gICAgICAoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCA9PT0gJ29iamVjdCcpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLmRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wsIC4uLnZhbHVlIH0gYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICgodmFsdWUgfHwgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAodGhpcy5jb250cm9sVmFsdWUsIGRlZmF1bHRWYWx1ZXMpIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnJlc2V0KGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldENvbnRyb2xWYWx1ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBhbnkge1xyXG4gICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUFycmF5KSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLmNvbnRyb2xzLm1hcChhcnJheUVsZW1lbnRDb250cm9sID0+IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGFycmF5RWxlbWVudENvbnRyb2wpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLnZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9ucz86IHsgc2VsZj86IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMuX3JlZHVjZVZhbHVlKCkgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblxyXG4gICAgLy8gZWl0aCB0aGlzIGlzIHRoZSByb290IHN1YiBmb3JtIG9yIHRoZXJlIGlzIG5vIHJvb3Qgc3ViIGZvcm1cclxuICAgIGlmIChvcHRpb25zPy5zZWxmIHx8IHRoaXMuaXNSb290IHx8ICEodGhpcy5wYXJlbnQgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudCBhcyBTdWJGb3JtR3JvdXA8YW55LCBhbnk+IHwgU3ViRm9ybUFycmF5PGFueSwgYW55PjtcclxuICAgIHBhcmVudC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIC8vdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgX3JlZHVjZVZhbHVlKCk6IFRDb250cm9sIHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB7fSBhcyBhbnk7XHJcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLmNvbnRyb2xzKSkge1xyXG4gICAgICBjb25zdCBjb250cm9sID0gdmFsdWUgYXMgQWJzdHJhY3RDb250cm9sO1xyXG4gICAgICBmb3JtVmFsdWVba2V5XSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGNvbnRyb2wpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlIHx8ICh7fSBhcyBURm9ybSkpIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHJldHVybiBjb250cm9sVmFsdWU7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0aGlzIGlkZWEgb2YgdGhpcyBpcyB0aGF0IHdoZW4gYSBub24gc3ViIGZvcm0gZ3JvdXAgaXMgYmVpbmcgdXBkYXRlZCB0aGUgc3ViIGZvcm0gZ3JvdXAgbmVlZHMgdG8gYmUgbm90aWZlZFxyXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hGb3JtQ29udHJvbDxUQ29udHJvbCwgVEZvcm0+KHN1YkZvcm1Hcm91cDogU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybT4sIGNvbnRyb2w6IEZvcm1Db250cm9sKSB7XHJcbiAgY29uc3QgcGF0Y2hhYmxlQ29udHJvbCA9IGNvbnRyb2wgYXMgRm9ybUNvbnRyb2wgJiB7IGlzUGF0Y2hlZDogYm9vbGVhbiB9O1xyXG5cclxuICBpZiAoIXBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkKSB7XHJcbiAgICBjb25zdCBzZXRWYWx1ZSA9IHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUuYmluZChwYXRjaGFibGVDb250cm9sKTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUgPSAodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSA9PiB7XHJcbiAgICAgIHNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICAgc3ViRm9ybUdyb3VwLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgfTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkID0gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtQXJyYXk8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUFycmF5IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICAvL3B1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbFtdO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+LFxyXG4gICAgY29udHJvbHM6IEFic3RyYWN0Q29udHJvbFtdLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcihjb250cm9scyk7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcblxyXG4gICAgdGhpcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICAvLyBmb3Igc29tZSByZWFzb24gcm9vdCBpcyBub3QgcHJvcGVybHkgc2V0IGZvciBmb3JtIGFycmF5XHJcbiAgICAvLyBvbiB0aGUgb3RoZXIgaGFuZCBmb3JtIGFycmF5IHNob3VsZCBuZXZlciBiZSByb290IGFueXdheSBzbyB3ZSBjYW4gaWdub3JlIHRoc2kgZm9yIG5vd1xyXG4gICAgLy8gaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgLy8gICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkge1xyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgKHRoaXMucGFyZW50IGFzIGFueSkudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlbW92ZUF0KGluZGV4KTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuIl19