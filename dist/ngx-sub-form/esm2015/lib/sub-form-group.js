import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray, } from '@angular/forms';
class CustomEventEmitter extends EventEmitter {
    setSubForm(subForm) {
        this.subForm = subForm;
        this.transformToFormGroup = (obj, defaultValues) => {
            return this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
    }
    emit(value) {
        // all those would happen while the sub-form tree is still being initalized
        // we can safely ignore all emits until subForm is set
        // since in ngOnInit of sub-form-component base class we call reset with the intial values
        if (!this.subForm) {
            return;
        }
        const transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        // this.subForm.handleFormArrayControls(transformedValue);
        return super.emit(transformedValue);
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
    set value(value) {
        if (!this.subForm) {
            return;
        }
        const transformedValue = this.transformToFormGroup(value, {});
        // TODO rethink as this might not work as we want it, we might not even need this anymore
        // @ts-ignore
        super.value = transformedValue;
        this.controlValue = value;
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
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
    }
    getRawValue() {
        const rawValue = super.getRawValue();
        return this.transformFromFormGroup(rawValue);
    }
    setValue(value, options = {}) {
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
        const transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        super.patchValue(transformedValue, options);
    }
    patchValue(value, options = {}) {
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
        const transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        super.patchValue(transformedValue, options);
    }
    reset(value = {}, options = {}) {
        // reset is triggered from parent when formgroup is created
        // then again from sub-form inside ngOnInit after subForm was set
        // so when can safely ignore resets prior to subForm being set
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        // special handling for array sub-forms
        if (Array.isArray(value)) {
            this.controlValue = (value || []);
        }
        else {
            this.controlValue = Object.assign(Object.assign({}, this.controlValue), value);
        }
        const formValue = this.transformToFormGroup(value, this.getDefaultValues());
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        super.reset(formValue, options);
        // const controlValue = (this.transformFromFormGroup((value as unknown) as TForm) as unknown) as TControl;
    }
    updateValue(options) {
        if (!this.subForm) {
            return;
        }
        const formValue = {};
        for (const [key, value] of Object.entries(this.subForm.formGroup.controls)) {
            const control = value;
            if (control instanceof SubFormGroup) {
                formValue[key] = control.controlValue;
            }
            else {
                formValue[key] = control.value;
            }
        }
        const controlValue = this.transformFromFormGroup(formValue || {});
        this.controlValue = controlValue;
        if (this.isRoot) {
            return;
        }
        let parentSubFromGroup;
        // if (this.parent instanceof FormArray) {
        //   parentSubFromGroup = this.parent.parent;
        // } else {
        parentSubFromGroup = this.parent;
        //}
        if (!parentSubFromGroup) {
            debugger;
        }
        parentSubFromGroup.updateValue(options);
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
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBcUIsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUdMLFNBQVMsRUFHVCxTQUFTLEdBRVYsTUFBTSxnQkFBZ0IsQ0FBQztBQUl4QixNQUFNLGtCQUErQyxTQUFRLFlBQXNCO0lBTWpGLFVBQVUsQ0FBQyxPQUE2QztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUV2QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxHQUFvQixFQUFFLGFBQTZCLEVBQUUsRUFBRTtZQUNsRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLElBQUssRUFBWSxDQUFDO1FBQ25GLENBQUMsQ0FBQztRQUNGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsSUFBSSxDQUFDLEtBQWdCO1FBQ25CLDJFQUEyRTtRQUMzRSxzREFBc0Q7UUFDdEQsMEZBQTBGO1FBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVELE1BQU0sZ0JBQWdCLEdBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFFLEtBQWdDLEVBQUUsRUFBRSxDQUF5QixDQUFDO1FBRW5ILDJDQUEyQztRQUMzQywwREFBMEQ7UUFFMUQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFP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U0FBMkMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELFdBQVcsQ0FBQyxPQUFZO1FBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVBLElBQUksQ0FBQyxNQUFjLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLHVDQUF1QztJQUN6QyxDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQWE7UUFDcEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQTJDLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciwgQ2hhbmdlRGV0ZWN0b3JSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUdyb3VwLFxyXG4gIFZhbGlkYXRvckZuLFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIEZvcm1BcnJheSxcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5cclxuaW1wb3J0IHsgTmd4U3ViRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLmNvbXBvbmVudCc7XHJcblxyXG5jbGFzcyBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRXZlbnRFbWl0dGVyPFRDb250cm9sPiB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ107XHJcbiAgfVxyXG5cclxuICBlbWl0KHZhbHVlPzogVENvbnRyb2wpOiB2b2lkIHtcclxuICAgIC8vIGFsbCB0aG9zZSB3b3VsZCBoYXBwZW4gd2hpbGUgdGhlIHN1Yi1mb3JtIHRyZWUgaXMgc3RpbGwgYmVpbmcgaW5pdGFsaXplZFxyXG4gICAgLy8gd2UgY2FuIHNhZmVseSBpZ25vcmUgYWxsIGVtaXRzIHVudGlsIHN1YkZvcm0gaXMgc2V0XHJcbiAgICAvLyBzaW5jZSBpbiBuZ09uSW5pdCBvZiBzdWItZm9ybS1jb21wb25lbnQgYmFzZSBjbGFzcyB3ZSBjYWxsIHJlc2V0IHdpdGggdGhlIGludGlhbCB2YWx1ZXNcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIGFueSkgYXMgVENvbnRyb2wgfCBudWxsLCB7fSkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgLy8gdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRyYW5zZm9ybWVkVmFsdWUpO1xyXG5cclxuICAgIHJldHVybiBzdXBlci5lbWl0KHRyYW5zZm9ybWVkVmFsdWUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBGb3JtR3JvdXAge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgcHVibGljIGNkOiBDaGFuZ2VEZXRlY3RvclJlZiB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgcHVibGljIGNvbnRyb2xWYWx1ZSE6IFRDb250cm9sO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgdmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+IHwgbnVsbCxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICAgIC8vQE9wdGlvbmFsKCkgQEluamVjdChTVUJfRk9STV9DT01QT05FTlRfVE9LRU4pIHB1YmxpYyBwYXJlbnRTdWJGb3JtPzogTmd4U3ViRm9ybUNvbXBvbmVudDxhbnk+LFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcih7fSk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyBob3cgdG8gb3ZlcndyaXRlIGEgcHJvcGV0b3R5cGUgcHJvcGVydHlcclxuICAgIC8vICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZvbywgXCJiYXJcIiwge1xyXG4gICAgLy8gICAgIC8vIG9ubHkgcmV0dXJucyBvZGQgZGllIHNpZGVzXHJcbiAgICAvLyAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiAoTWF0aC5yYW5kb20oKSAqIDYpIHwgMTsgfVxyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgdW5kZWZpbmVkKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgQ3VzdG9tRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcbiAgfVxyXG5cclxuICBzZXRDaGFuZ2VEZXRlY3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHRoaXMuY2QgPSBjZDtcclxuICB9XHJcblxyXG4gIGdldCB2YWx1ZSgpIHtcclxuICAgIC8vIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAvLyAgIHJldHVybiBudWxsO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKFxyXG4gICAgLy8gICAoc3VwZXIudmFsdWUgYXMgYW55KSBhcyBURm9ybSxcclxuICAgIC8vICkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICAvLyByZXR1cm4gdHJhbnNmb3JtZWRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sVmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIHJldGhpbmsgYXMgdGhpcyBtaWdodCBub3Qgd29yayBhcyB3ZSB3YW50IGl0LCB3ZSBtaWdodCBub3QgZXZlbiBuZWVkIHRoaXMgYW55bW9yZVxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgPSB0cmFuc2Zvcm1lZFZhbHVlO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuICB9XHJcblxyXG4gIGdldFJhd1ZhbHVlKCk6IGFueSB7XHJcbiAgICBjb25zdCByYXdWYWx1ZSA9IHN1cGVyLmdldFJhd1ZhbHVlKCk7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKHJhd1ZhbHVlKTtcclxuICB9XHJcblxyXG4gIHNldFZhbHVlKHZhbHVlOiBUQ29udHJvbCwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgd2hlbiB0aGUgcGFyZW50IHNldHMgYSB2YWx1ZSBidXQgdGhlIHN1Yi1mb3JtLWNvbXBvbmVudCBoYXMgbm90IHR1biBuZ09uSW5pdCB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLmNvbnRyb2xWYWx1ZSwgLi4udmFsdWUgfTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyh0aGlzLmNvbnRyb2xWYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh0cmFuc2Zvcm1lZFZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHBhdGNoVmFsdWUodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRoaXMuY29udHJvbFZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKHRyYW5zZm9ybWVkVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcmVzZXQodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+ID0ge30sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gcmVzZXQgaXMgdHJpZ2dlcmVkIGZyb20gcGFyZW50IHdoZW4gZm9ybWdyb3VwIGlzIGNyZWF0ZWRcclxuICAgIC8vIHRoZW4gYWdhaW4gZnJvbSBzdWItZm9ybSBpbnNpZGUgbmdPbkluaXQgYWZ0ZXIgc3ViRm9ybSB3YXMgc2V0XHJcbiAgICAvLyBzbyB3aGVuIGNhbiBzYWZlbHkgaWdub3JlIHJlc2V0cyBwcmlvciB0byBzdWJGb3JtIGJlaW5nIHNldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3BlY2lhbCBoYW5kbGluZyBmb3IgYXJyYXkgc3ViLWZvcm1zXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgW10pIGFzIGFueTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLmNvbnRyb2xWYWx1ZSwgLi4udmFsdWUgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgICAgKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLFxyXG4gICAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKSxcclxuICAgICkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRoaXMuY29udHJvbFZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5yZXNldChmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIGNvbnN0IGNvbnRyb2xWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRGb3JtKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHt9IGFzIGFueTtcclxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbHMpKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2wgPSB2YWx1ZSBhcyBBYnN0cmFjdENvbnRyb2w7XHJcbiAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSB7XHJcbiAgICAgICAgZm9ybVZhbHVlW2tleV0gPSBjb250cm9sLmNvbnRyb2xWYWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3JtVmFsdWVba2V5XSA9IGNvbnRyb2wudmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZSB8fCAoe30gYXMgVEZvcm0pKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHJcbiAgICBpZiAodGhpcy5pc1Jvb3QpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBwYXJlbnRTdWJGcm9tR3JvdXA6IGFueTtcclxuICAgIC8vIGlmICh0aGlzLnBhcmVudCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgLy8gICBwYXJlbnRTdWJGcm9tR3JvdXAgPSB0aGlzLnBhcmVudC5wYXJlbnQ7XHJcbiAgICAvLyB9IGVsc2Uge1xyXG4gICAgcGFyZW50U3ViRnJvbUdyb3VwID0gdGhpcy5wYXJlbnQ7XHJcbiAgICAvL31cclxuXHJcbiAgICBpZiAoIXBhcmVudFN1YkZyb21Hcm91cCkge1xyXG4gICAgICBkZWJ1Z2dlcjtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnRTdWJGcm9tR3JvdXAudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIHRoaXMgaWRlYSBvZiB0aGlzIGlzIHRoYXQgd2hlbiBhIG5vbiBzdWIgZm9ybSBncm91cCBpcyBiZWluZyB1cGRhdGVkIHRoZSBzdWIgZm9ybSBncm91cCBuZWVkcyB0byBiZSBub3RpZmVkXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXRjaEZvcm1Db250cm9sPFRDb250cm9sLCBURm9ybT4oc3ViRm9ybUdyb3VwOiBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtPiwgY29udHJvbDogRm9ybUNvbnRyb2wpIHtcclxuICBjb25zdCBwYXRjaGFibGVDb250cm9sID0gY29udHJvbCBhcyBGb3JtQ29udHJvbCAmIHsgaXNQYXRjaGVkOiBib29sZWFuIH07XHJcblxyXG4gIGlmICghcGF0Y2hhYmxlQ29udHJvbC5pc1BhdGNoZWQpIHtcclxuICAgIGNvbnN0IHNldFZhbHVlID0gcGF0Y2hhYmxlQ29udHJvbC5zZXRWYWx1ZS5iaW5kKHBhdGNoYWJsZUNvbnRyb2wpO1xyXG4gICAgcGF0Y2hhYmxlQ29udHJvbC5zZXRWYWx1ZSA9ICh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpID0+IHtcclxuICAgICAgc2V0VmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgICBzdWJGb3JtR3JvdXAudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICB9O1xyXG4gICAgcGF0Y2hhYmxlQ29udHJvbC5pc1BhdGNoZWQgPSB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1BcnJheTxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBGb3JtQXJyYXkge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgcHJpdmF0ZSBpc1Jvb3QgPSBmYWxzZTtcclxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHB1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbFtdO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+LFxyXG4gICAgY29udHJvbHM6IEFic3RyYWN0Q29udHJvbFtdLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcihjb250cm9scyk7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcblxyXG4gICAgdGhpcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICAvLyBmb3Igc29tZSByZWFzb24gcm9vdCBpcyBub3QgcHJvcGVybHkgc2V0IGZvciBmb3JtIGFycmF5XHJcbiAgICAvLyBvbiB0aGUgb3RoZXIgaGFuZCBmb3JtIGFycmF5IHNob3VsZCBuZXZlciBiZSByb290IGFueXdheSBzbyB3ZSBjYW4gaWdub3JlIHRoc2kgZm9yIG5vd1xyXG4gICAgLy8gaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgLy8gICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICBzdXBlci5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgKCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwIGFzIHVua25vd24pIGFzIFN1YkZvcm1Hcm91cDxhbnk+KS51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgICh0aGlzLnBhcmVudCBhcyBhbnkpLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVBdChpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVBdChpbmRleCk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==