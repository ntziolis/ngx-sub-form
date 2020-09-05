import { __assign, __extends, __read, __values } from "tslib";
import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray, } from '@angular/forms';
var CustomEventEmitter = /** @class */ (function (_super) {
    __extends(CustomEventEmitter, _super);
    function CustomEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CustomEventEmitter.prototype.setSubForm = function (subForm) {
        this.subForm = subForm;
    };
    CustomEventEmitter.prototype.emit = function (value) {
        // ignore all emit values until sub form tree is initialized
        if (!this.subForm) {
            return;
        }
        this.subForm.formGroup.updateValue({ self: true });
        _super.prototype.emit.call(this, this.subForm.formGroup.controlValue);
    };
    return CustomEventEmitter;
}(EventEmitter));
var SubFormGroup = /** @class */ (function (_super) {
    __extends(SubFormGroup, _super);
    function SubFormGroup(value, validatorOrOpts, asyncValidator) {
        var _this = 
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        _super.call(this, {}) || this;
        _this.isRoot = false;
        // this is how to overwrite a propetotype property
        //   Object.defineProperty(foo, "bar", {
        //     // only returns odd die sides
        //     get: function () { return (Math.random() * 6) | 1; }
        // });
        _this.controlValue = (value || undefined);
        _this._valueChanges = new CustomEventEmitter();
        _this.valueChanges = _this._valueChanges;
        _this.parentValidatorOrOpts = validatorOrOpts;
        _this.parentAsyncValidator = asyncValidator;
        return _this;
    }
    SubFormGroup.prototype.setChangeDetector = function (cd) {
        this.cd = cd;
    };
    Object.defineProperty(SubFormGroup.prototype, "value", {
        get: function () {
            // if (!this.subForm) {
            //   return null;
            // }
            // const transformedValue = (this.transformFromFormGroup(
            //   (super.value as any) as TForm,
            // ) as unknown) as TControl;
            // return transformedValue;
            return this.controlValue;
        },
        // this method is being called from angular code only
        set: function (value) {
            if (!this.subForm) {
                return;
            }
            var controlValue = this.transformFromFormGroup(value);
            this.controlValue = controlValue;
            // @ts-ignore
            _super.prototype.value = controlValue;
            //const formValue = (this.transformToFormGroup((value as unknown) as TControl, {}) as unknown) as TForm;
            // TODO rethink as this might not work as we want it, we might not even need this anymore
            // @ts-ignore
            // (super.value as any) = formValue;
            //this.controlValue = value;
        },
        enumerable: true,
        configurable: true
    });
    SubFormGroup.prototype.setSubForm = function (subForm) {
        var _this = this;
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        if (this.root === this) {
            this.isRoot = true;
        }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = function (obj, defaultValues) {
            return _this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    };
    SubFormGroup.prototype.getRawValue = function () {
        var rawValue = _super.prototype.getRawValue.call(this);
        return this.transformFromFormGroup(rawValue);
    };
    SubFormGroup.prototype.setValue = function (value, options) {
        if (options === void 0) { options = {}; }
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
        var formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        _super.prototype.patchValue.call(this, formValue, options);
    };
    SubFormGroup.prototype.patchValue = function (value, options) {
        if (options === void 0) { options = {}; }
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
        this.controlValue = __assign(__assign({}, this.controlValue), value);
        // TODO check if providing {} does work, as we do not want to override existing values with default values
        // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
        // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
        var formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        _super.prototype.patchValue.call(this, formValue, options);
    };
    SubFormGroup.prototype.reset = function (value, options) {
        if (options === void 0) { options = {}; }
        // reset is triggered from parent when formgroup is created
        // then again from sub-form inside ngOnInit after subForm was set
        // so when can safely ignore resets prior to subForm being set
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        var defaultValues = this.getDefaultValues();
        var defaultValuesAsControl = this.transformFromFormGroup(defaultValues);
        // if value is an array skip merging with default values
        if (Array.isArray(value) || Array.isArray(defaultValuesAsControl)) {
            this.controlValue = value;
        }
        else if (
        // in js null is also of type object
        // hence we need to check for null before checking if its of type object
        (value !== null && typeof value === 'object') ||
            (defaultValuesAsControl !== null && typeof defaultValuesAsControl === 'object')) {
            this.controlValue = __assign(__assign({}, defaultValuesAsControl), value);
        }
        else {
            this.controlValue = (value || defaultValuesAsControl);
        }
        var formValue = this.transformToFormGroup(this.controlValue, defaultValues);
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        _super.prototype.reset.call(this, formValue, options);
    };
    SubFormGroup.prototype.getControlValue = function (control) {
        var _this = this;
        if (control instanceof SubFormGroup) {
            return control.controlValue;
        }
        else if (control instanceof SubFormArray) {
            return control.controls.map(function (arrayElementControl) { return _this.getControlValue(arrayElementControl); });
        }
        else {
            return control.value;
        }
    };
    SubFormGroup.prototype.updateValue = function (options) {
        var e_1, _a;
        var _b;
        if (!this.subForm) {
            return;
        }
        var formValue = {};
        try {
            for (var _c = __values(Object.entries(this.subForm.formGroup.controls)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
                var control = value;
                formValue[key] = this.getControlValue(control);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var controlValue = this.transformFromFormGroup(formValue || {});
        this.controlValue = controlValue;
        // eith this is the root sub form or there is no root sub form
        if (((_b = options) === null || _b === void 0 ? void 0 : _b.self) || this.isRoot || !(this.parent instanceof SubFormGroup)) {
            return;
        }
        var parent = this.parent;
        parent.updateValue(options);
        //this.updateValueAndValidity(options);
    };
    return SubFormGroup;
}(FormGroup));
export { SubFormGroup };
// this idea of this is that when a non sub form group is being updated the sub form group needs to be notifed
export function patchFormControl(subFormGroup, control) {
    var patchableControl = control;
    if (!patchableControl.isPatched) {
        var setValue_1 = patchableControl.setValue.bind(patchableControl);
        patchableControl.setValue = function (value, options) {
            setValue_1(value, options);
            subFormGroup.updateValue(options);
        };
        patchableControl.isPatched = true;
    }
}
var SubFormArray = /** @class */ (function (_super) {
    __extends(SubFormArray, _super);
    function SubFormArray(subForm, controls, validatorOrOpts, asyncValidator) {
        var _this = 
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        _super.call(this, controls) || this;
        _this.isRoot = false;
        _this._valueChanges = new CustomEventEmitter();
        _this.valueChanges = _this._valueChanges;
        _this.parentValidatorOrOpts = validatorOrOpts;
        _this.parentAsyncValidator = asyncValidator;
        _this.setSubForm(subForm);
        return _this;
    }
    SubFormArray.prototype.setSubForm = function (subForm) {
        var _this = this;
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        // for some reason root is not properly set for form array
        // on the other hand form array should never be root anyway so we can ignore thsi for now
        // if (this.root === this) {
        //   this.isRoot = true;
        // }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = function (obj, defaultValues) {
            return _this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    };
    SubFormArray.prototype.setValue = function (value, options) {
        _super.prototype.setValue.call(this, value, options);
        this.subForm.formGroup.updateValue(options);
    };
    SubFormArray.prototype.patchValue = function (value, options) {
        _super.prototype.patchValue.call(this, value, options);
        this.subForm.formGroup.updateValue(options);
    };
    SubFormArray.prototype.updateValue = function (options) {
        if (!this.subForm) {
            return;
        }
        this.parent.updateValue(options);
        //this.updateValueAndValidity(options);
    };
    SubFormArray.prototype.removeAt = function (index) {
        _super.prototype.removeAt.call(this, index);
        this.subForm.formGroup.updateValue(undefined);
    };
    return SubFormArray;
}(FormArray));
export { SubFormArray };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQWlCQSxDQUFDO0lBZEMsdUNBQVUsR0FBVixVQUFXLE9BQTZDO1FBQ3RELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxpQ0FBSSxHQUFKLFVBQUssS0FBZ0I7UUFDbkIsNERBQTREO1FBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRW5ELGlCQUFNLElBQUksWUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0gseUJBQUM7QUFBRCxDQUFDLEFBakJELENBQTZELFlBQVksR0FpQnhFO0FBRUQ7SUFBOEQsZ0NBQVM7SUFjckUsc0JBQ0UsS0FBK0IsRUFDL0IsZUFBNkUsRUFDN0UsY0FBNkQ7UUFIL0Q7UUFNRSw0R0FBNEc7UUFDNUcsa0JBQU0sRUFBRSxDQUFDLFNBZ0JWO1FBakNPLFlBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxLQUFJLENBQUMs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SUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBeEVELENBQThELFNBQVMsR0F3RXRFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBDaGFuZ2VEZXRlY3RvclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtR3JvdXAsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgRm9ybUFycmF5LFxyXG4gIEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcblxyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50JztcclxuXHJcbmNsYXNzIEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBFdmVudEVtaXR0ZXI8VENvbnRyb2w+IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gIH1cclxuXHJcbiAgZW1pdCh2YWx1ZT86IFRDb250cm9sKTogdm9pZCB7XHJcbiAgICAvLyBpZ25vcmUgYWxsIGVtaXQgdmFsdWVzIHVudGlsIHN1YiBmb3JtIHRyZWUgaXMgaW5pdGlhbGl6ZWRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLnVwZGF0ZVZhbHVlKHsgc2VsZjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzdXBlci5lbWl0KHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbFZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUdyb3VwIHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBpc1Jvb3QgPSBmYWxzZTtcclxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHB1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbDtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHZhbHVlOiBQYXJ0aWFsPFRDb250cm9sPiB8IG51bGwsXHJcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCxcclxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwsXHJcbiAgICAvL0BPcHRpb25hbCgpIEBJbmplY3QoU1VCX0ZPUk1fQ09NUE9ORU5UX1RPS0VOKSBwdWJsaWMgcGFyZW50U3ViRm9ybT86IE5neFN1YkZvcm1Db21wb25lbnQ8YW55PixcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoe30pO1xyXG5cclxuICAgIC8vIHRoaXMgaXMgaG93IHRvIG92ZXJ3cml0ZSBhIHByb3BldG90eXBlIHByb3BlcnR5XHJcbiAgICAvLyAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmb28sIFwiYmFyXCIsIHtcclxuICAgIC8vICAgICAvLyBvbmx5IHJldHVybnMgb2RkIGRpZSBzaWRlc1xyXG4gICAgLy8gICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKE1hdGgucmFuZG9tKCkgKiA2KSB8IDE7IH1cclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gKHZhbHVlIHx8IHVuZGVmaW5lZCkgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG5cclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG4gIH1cclxuXHJcbiAgc2V0Q2hhbmdlRGV0ZWN0b3IoY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XHJcbiAgICB0aGlzLmNkID0gY2Q7XHJcbiAgfVxyXG5cclxuICBnZXQgdmFsdWUoKSB7XHJcbiAgICAvLyBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgLy8gICByZXR1cm4gbnVsbDtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChcclxuICAgIC8vICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgYXMgVEZvcm0sXHJcbiAgICAvLyApIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgLy8gcmV0dXJuIHRyYW5zZm9ybWVkVmFsdWU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhpcyBtZXRob2QgaXMgYmVpbmcgY2FsbGVkIGZyb20gYW5ndWxhciBjb2RlIG9ubHlcclxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVEZvcm0pIGFzIFRDb250cm9sO1xyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgPSBjb250cm9sVmFsdWU7XHJcbiAgICAvL2NvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG4gICAgLy8gVE9ETyByZXRoaW5rIGFzIHRoaXMgbWlnaHQgbm90IHdvcmsgYXMgd2Ugd2FudCBpdCwgd2UgbWlnaHQgbm90IGV2ZW4gbmVlZCB0aGlzIGFueW1vcmVcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIC8vIChzdXBlci52YWx1ZSBhcyBhbnkpID0gZm9ybVZhbHVlO1xyXG4gICAgLy90aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICBpZiAodGhpcy5yb290ID09PSB0aGlzKSB7XHJcbiAgICAgIHRoaXMuaXNSb290ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0cmFuc2Zvcm0gdG8gZm9ybSBncm91cCBzaG91bGQgbmV2ZXIgcmV0dXJuIG51bGwgLyB1bmRlZmluZWQgYnV0IHt9IGluc3RlYWRcclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIGdldFJhd1ZhbHVlKCk6IFRDb250cm9sIHtcclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gc3VwZXIuZ2V0UmF3VmFsdWUoKTtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAocmF3VmFsdWUpIGFzIFRDb250cm9sO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IFRDb250cm9sLCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgcnVuIG5nQ2hhbmdlcyB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHBhdGNoVmFsdWUodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHdoZW4gdmFsdWUgaXMgbnVsbCB0cmVhdCBwYXRjaCB2YWx1ZSBhcyBzZXQgdmFsdWVcclxuICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0VmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZXNldCh2YWx1ZT86IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHJlc2V0IGlzIHRyaWdnZXJlZCBmcm9tIHBhcmVudCB3aGVuIGZvcm1ncm91cCBpcyBjcmVhdGVkXHJcbiAgICAvLyB0aGVuIGFnYWluIGZyb20gc3ViLWZvcm0gaW5zaWRlIG5nT25Jbml0IGFmdGVyIHN1YkZvcm0gd2FzIHNldFxyXG4gICAgLy8gc28gd2hlbiBjYW4gc2FmZWx5IGlnbm9yZSByZXNldHMgcHJpb3IgdG8gc3ViRm9ybSBiZWluZyBzZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWUgYXMgVENvbnRyb2w7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKSBhcyBURm9ybTtcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcykgYXMgVENvbnRyb2w7XHJcbiAgICAvLyBpZiB2YWx1ZSBpcyBhbiBhcnJheSBza2lwIG1lcmdpbmcgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IEFycmF5LmlzQXJyYXkoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkpIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAvLyBpbiBqcyBudWxsIGlzIGFsc28gb2YgdHlwZSBvYmplY3RcclxuICAgICAgLy8gaGVuY2Ugd2UgbmVlZCB0byBjaGVjayBmb3IgbnVsbCBiZWZvcmUgY2hlY2tpbmcgaWYgaXRzIG9mIHR5cGUgb2JqZWN0XHJcbiAgICAgICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB8fFxyXG4gICAgICAoZGVmYXVsdFZhbHVlc0FzQ29udHJvbCAhPT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCA9PT0gJ29iamVjdCcpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLmRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wsIC4uLnZhbHVlIH0gYXMgVENvbnRyb2w7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICgodmFsdWUgfHwgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAodGhpcy5jb250cm9sVmFsdWUsIGRlZmF1bHRWYWx1ZXMpIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnJlc2V0KGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldENvbnRyb2xWYWx1ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBhbnkge1xyXG4gICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUFycmF5KSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLmNvbnRyb2xzLm1hcChhcnJheUVsZW1lbnRDb250cm9sID0+IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGFycmF5RWxlbWVudENvbnRyb2wpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLnZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9ucz86IHsgc2VsZj86IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHt9IGFzIGFueTtcclxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAuY29udHJvbHMpKSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2wgPSB2YWx1ZSBhcyBBYnN0cmFjdENvbnRyb2w7XHJcbiAgICAgIGZvcm1WYWx1ZVtrZXldID0gdGhpcy5nZXRDb250cm9sVmFsdWUoY29udHJvbCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWUgfHwgKHt9IGFzIFRGb3JtKSkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblxyXG4gICAgLy8gZWl0aCB0aGlzIGlzIHRoZSByb290IHN1YiBmb3JtIG9yIHRoZXJlIGlzIG5vIHJvb3Qgc3ViIGZvcm1cclxuICAgIGlmIChvcHRpb25zPy5zZWxmIHx8IHRoaXMuaXNSb290IHx8ICEodGhpcy5wYXJlbnQgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudCBhcyBTdWJGb3JtR3JvdXA8YW55LCBhbnk+IHwgU3ViRm9ybUFycmF5PGFueSwgYW55PjtcclxuICAgIHBhcmVudC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIC8vdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdGlvbnMpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGhpcyBpZGVhIG9mIHRoaXMgaXMgdGhhdCB3aGVuIGEgbm9uIHN1YiBmb3JtIGdyb3VwIGlzIGJlaW5nIHVwZGF0ZWQgdGhlIHN1YiBmb3JtIGdyb3VwIG5lZWRzIHRvIGJlIG5vdGlmZWRcclxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRm9ybUNvbnRyb2w8VENvbnRyb2wsIFRGb3JtPihzdWJGb3JtR3JvdXA6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+LCBjb250cm9sOiBGb3JtQ29udHJvbCkge1xyXG4gIGNvbnN0IHBhdGNoYWJsZUNvbnRyb2wgPSBjb250cm9sIGFzIEZvcm1Db250cm9sICYgeyBpc1BhdGNoZWQ6IGJvb2xlYW4gfTtcclxuXHJcbiAgaWYgKCFwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCkge1xyXG4gICAgY29uc3Qgc2V0VmFsdWUgPSBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlLmJpbmQocGF0Y2hhYmxlQ29udHJvbCk7XHJcbiAgICBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlID0gKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgICBzZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgIHN1YkZvcm1Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIH07XHJcbiAgICBwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUFycmF5PFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1BcnJheSB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgLy9wdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2xbXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPixcclxuICAgIGNvbnRyb2xzOiBBYnN0cmFjdENvbnRyb2xbXSxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoY29udHJvbHMpO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG5cclxuICAgIHRoaXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcblxyXG4gICAgLy8gZm9yIHNvbWUgcmVhc29uIHJvb3QgaXMgbm90IHByb3Blcmx5IHNldCBmb3IgZm9ybSBhcnJheVxyXG4gICAgLy8gb24gdGhlIG90aGVyIGhhbmQgZm9ybSBhcnJheSBzaG91bGQgbmV2ZXIgYmUgcm9vdCBhbnl3YXkgc28gd2UgY2FuIGlnbm9yZSB0aHNpIGZvciBub3dcclxuICAgIC8vIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgIC8vICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICBzdXBlci5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgKCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwIGFzIHVua25vd24pIGFzIFN1YkZvcm1Hcm91cDxhbnk+KS51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgICh0aGlzLnBhcmVudCBhcyBhbnkpLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVBdChpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVBdChpbmRleCk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==