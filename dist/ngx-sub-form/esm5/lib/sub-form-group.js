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
            // if (!this.subForm) {
            //   return;
            // }
            // @ts-ignore
            _super.prototype.value = value;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQWlCQSxDQUFDO0lBZEMsdUNBQVUsR0FBVixVQUFXLE9BQTZDO1FBQ3RELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxpQ0FBSSxHQUFKLFVBQUssS0FBZ0I7UUFDbkIsNERBQTREO1FBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRW5ELGlCQUFNLElBQUksWUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0gseUJBQUM7QUFBRCxDQUFDLEFBakJELENBQTZELFlBQVksR0FpQnhFO0FBRUQ7SUFBOEQsZ0NBQVM7SUFjckUsc0JBQ0UsS0FBK0IsRUFDL0IsZUFBNkUsRUFDN0UsY0FBNkQ7UUFIL0Q7UUFNRSw0R0FBNEc7UUFDNUcsa0JBQU0sRUFBRSxDQUFDLFNBZ0JWO1FBakNPLFlBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxLQUFJLENBQUMs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b3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIENoYW5nZURldGVjdG9yUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1Hcm91cCxcclxuICBWYWxpZGF0b3JGbixcclxuICBGb3JtQ29udHJvbCxcclxuICBGb3JtQXJyYXksXHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuXHJcbmltcG9ydCB7IE5neFN1YkZvcm1Db21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5cclxuY2xhc3MgQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEV2ZW50RW1pdHRlcjxUQ29udHJvbD4ge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgfVxyXG5cclxuICBlbWl0KHZhbHVlPzogVENvbnRyb2wpOiB2b2lkIHtcclxuICAgIC8vIGlnbm9yZSBhbGwgZW1pdCB2YWx1ZXMgdW50aWwgc3ViIGZvcm0gdHJlZSBpcyBpbml0aWFsaXplZFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAudXBkYXRlVmFsdWUoeyBzZWxmOiB0cnVlIH0pO1xyXG5cclxuICAgIHN1cGVyLmVtaXQodGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9sVmFsdWUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBGb3JtR3JvdXAge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgcHVibGljIGNkOiBDaGFuZ2VEZXRlY3RvclJlZiB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgcHVibGljIGNvbnRyb2xWYWx1ZSE6IFRDb250cm9sO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgdmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+IHwgbnVsbCxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICAgIC8vQE9wdGlvbmFsKCkgQEluamVjdChTVUJfRk9STV9DT01QT05FTlRfVE9LRU4pIHB1YmxpYyBwYXJlbnRTdWJGb3JtPzogTmd4U3ViRm9ybUNvbXBvbmVudDxhbnk+LFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcih7fSk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyBob3cgdG8gb3ZlcndyaXRlIGEgcHJvcGV0b3R5cGUgcHJvcGVydHlcclxuICAgIC8vICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZvbywgXCJiYXJcIiwge1xyXG4gICAgLy8gICAgIC8vIG9ubHkgcmV0dXJucyBvZGQgZGllIHNpZGVzXHJcbiAgICAvLyAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiAoTWF0aC5yYW5kb20oKSAqIDYpIHwgMTsgfVxyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgdW5kZWZpbmVkKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgQ3VzdG9tRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcbiAgfVxyXG5cclxuICBzZXRDaGFuZ2VEZXRlY3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHRoaXMuY2QgPSBjZDtcclxuICB9XHJcblxyXG4gIGdldCB2YWx1ZSgpIHtcclxuICAgIC8vIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAvLyAgIHJldHVybiBudWxsO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKFxyXG4gICAgLy8gICAoc3VwZXIudmFsdWUgYXMgYW55KSBhcyBURm9ybSxcclxuICAgIC8vICkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICAvLyByZXR1cm4gdHJhbnNmb3JtZWRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sVmFsdWU7XHJcbiAgfVxyXG5cclxuICAvLyB0aGlzIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQgZnJvbSBhbmd1bGFyIGNvZGUgb25seVxyXG4gIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICAvLyBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgLy8gICByZXR1cm47XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgPSB2YWx1ZTtcclxuICAgIC8vY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcbiAgICAvLyBUT0RPIHJldGhpbmsgYXMgdGhpcyBtaWdodCBub3Qgd29yayBhcyB3ZSB3YW50IGl0LCB3ZSBtaWdodCBub3QgZXZlbiBuZWVkIHRoaXMgYW55bW9yZVxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgLy8gKHN1cGVyLnZhbHVlIGFzIGFueSkgPSBmb3JtVmFsdWU7XHJcbiAgICAvL3RoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmF3VmFsdWUoKTogVENvbnRyb2wge1xyXG4gICAgY29uc3QgcmF3VmFsdWUgPSBzdXBlci5nZXRSYXdWYWx1ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChyYXdWYWx1ZSkgYXMgVENvbnRyb2w7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogVENvbnRyb2wsIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCBydW4gbmdDaGFuZ2VzIHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZShmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gd2hlbiB2YWx1ZSBpcyBudWxsIHRyZWF0IHBhdGNoIHZhbHVlIGFzIHNldCB2YWx1ZVxyXG4gICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCB0dW4gbmdPbkluaXQgeWV0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4udGhpcy5jb250cm9sVmFsdWUsIC4uLnZhbHVlIH07XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlc2V0KHZhbHVlPzogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gcmVzZXQgaXMgdHJpZ2dlcmVkIGZyb20gcGFyZW50IHdoZW4gZm9ybWdyb3VwIGlzIGNyZWF0ZWRcclxuICAgIC8vIHRoZW4gYWdhaW4gZnJvbSBzdWItZm9ybSBpbnNpZGUgbmdPbkluaXQgYWZ0ZXIgc3ViRm9ybSB3YXMgc2V0XHJcbiAgICAvLyBzbyB3aGVuIGNhbiBzYWZlbHkgaWdub3JlIHJlc2V0cyBwcmlvciB0byBzdWJGb3JtIGJlaW5nIHNldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpIGFzIFRGb3JtO1xyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlc0FzQ29udHJvbCA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChkZWZhdWx0VmFsdWVzKSBhcyBUQ29udHJvbDtcclxuICAgIC8vIGlmIHZhbHVlIGlzIGFuIGFycmF5IHNraXAgbWVyZ2luZyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgQXJyYXkuaXNBcnJheShkZWZhdWx0VmFsdWVzQXNDb250cm9sKSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgIC8vIGluIGpzIG51bGwgaXMgYWxzbyBvZiB0eXBlIG9iamVjdFxyXG4gICAgICAvLyBoZW5jZSB3ZSBuZWVkIHRvIGNoZWNrIGZvciBudWxsIGJlZm9yZSBjaGVja2luZyBpZiBpdHMgb2YgdHlwZSBvYmplY3RcclxuICAgICAgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHx8XHJcbiAgICAgIChkZWZhdWx0VmFsdWVzQXNDb250cm9sICE9PSBudWxsICYmIHR5cGVvZiBkZWZhdWx0VmFsdWVzQXNDb250cm9sID09PSAnb2JqZWN0JylcclxuICAgICkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4uZGVmYXVsdFZhbHVlc0FzQ29udHJvbCwgLi4udmFsdWUgfSBhcyBUQ29udHJvbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gKCh2YWx1ZSB8fCBkZWZhdWx0VmFsdWVzQXNDb250cm9sKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCh0aGlzLmNvbnRyb2xWYWx1ZSwgZGVmYXVsdFZhbHVlcykgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucmVzZXQoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0Q29udHJvbFZhbHVlKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IGFueSB7XHJcbiAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gY29udHJvbC5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2UgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtQXJyYXkpIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbHMubWFwKGFycmF5RWxlbWVudENvbnRyb2wgPT4gdGhpcy5nZXRDb250cm9sVmFsdWUoYXJyYXlFbGVtZW50Q29udHJvbCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wudmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVWYWx1ZShvcHRpb25zPzogeyBzZWxmPzogYm9vbGVhbiB9KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0ge30gYXMgYW55O1xyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9scykpIHtcclxuICAgICAgY29uc3QgY29udHJvbCA9IHZhbHVlIGFzIEFic3RyYWN0Q29udHJvbDtcclxuICAgICAgZm9ybVZhbHVlW2tleV0gPSB0aGlzLmdldENvbnRyb2xWYWx1ZShjb250cm9sKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZSB8fCAoe30gYXMgVEZvcm0pKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHJcbiAgICAvLyBlaXRoIHRoaXMgaXMgdGhlIHJvb3Qgc3ViIGZvcm0gb3IgdGhlcmUgaXMgbm8gcm9vdCBzdWIgZm9ybVxyXG4gICAgaWYgKG9wdGlvbnM/LnNlbGYgfHwgdGhpcy5pc1Jvb3QgfHwgISh0aGlzLnBhcmVudCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50IGFzIFN1YkZvcm1Hcm91cDxhbnksIGFueT4gfCBTdWJGb3JtQXJyYXk8YW55LCBhbnk+O1xyXG4gICAgcGFyZW50LnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0aGlzIGlkZWEgb2YgdGhpcyBpcyB0aGF0IHdoZW4gYSBub24gc3ViIGZvcm0gZ3JvdXAgaXMgYmVpbmcgdXBkYXRlZCB0aGUgc3ViIGZvcm0gZ3JvdXAgbmVlZHMgdG8gYmUgbm90aWZlZFxyXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hGb3JtQ29udHJvbDxUQ29udHJvbCwgVEZvcm0+KHN1YkZvcm1Hcm91cDogU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybT4sIGNvbnRyb2w6IEZvcm1Db250cm9sKSB7XHJcbiAgY29uc3QgcGF0Y2hhYmxlQ29udHJvbCA9IGNvbnRyb2wgYXMgRm9ybUNvbnRyb2wgJiB7IGlzUGF0Y2hlZDogYm9vbGVhbiB9O1xyXG5cclxuICBpZiAoIXBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkKSB7XHJcbiAgICBjb25zdCBzZXRWYWx1ZSA9IHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUuYmluZChwYXRjaGFibGVDb250cm9sKTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUgPSAodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSA9PiB7XHJcbiAgICAgIHNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICAgc3ViRm9ybUdyb3VwLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgfTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkID0gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtQXJyYXk8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUFycmF5IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICAvL3B1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbFtdO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+LFxyXG4gICAgY29udHJvbHM6IEFic3RyYWN0Q29udHJvbFtdLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcihjb250cm9scyk7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcblxyXG4gICAgdGhpcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICAvLyBmb3Igc29tZSByZWFzb24gcm9vdCBpcyBub3QgcHJvcGVybHkgc2V0IGZvciBmb3JtIGFycmF5XHJcbiAgICAvLyBvbiB0aGUgb3RoZXIgaGFuZCBmb3JtIGFycmF5IHNob3VsZCBuZXZlciBiZSByb290IGFueXdheSBzbyB3ZSBjYW4gaWdub3JlIHRoc2kgZm9yIG5vd1xyXG4gICAgLy8gaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgLy8gICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkge1xyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgKHRoaXMucGFyZW50IGFzIGFueSkudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlbW92ZUF0KGluZGV4KTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuIl19