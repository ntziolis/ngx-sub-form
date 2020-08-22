import { __assign, __extends, __read, __values } from "tslib";
import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray, } from '@angular/forms';
var CustomEventEmitter = /** @class */ (function (_super) {
    __extends(CustomEventEmitter, _super);
    function CustomEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CustomEventEmitter.prototype.setSubForm = function (subForm) {
        var _this = this;
        this.subForm = subForm;
        this.transformToFormGroup = function (obj, defaultValues) {
            return _this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
    };
    CustomEventEmitter.prototype.emit = function (value) {
        // all those would happen while the sub-form tree is still being initalized
        // we can safely ignore all emits until subForm is set
        // since in ngOnInit of sub-form-component base class we call reset with the intial values
        if (!this.subForm) {
            return;
        }
        var transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        // this.subForm.handleFormArrayControls(transformedValue);
        return _super.prototype.emit.call(this, transformedValue);
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
        set: function (value) {
            if (!this.subForm) {
                return;
            }
            var transformedValue = this.transformToFormGroup(value, {});
            // TODO rethink as this might not work as we want it, we might not even need this anymore
            // @ts-ignore
            _super.prototype.value = transformedValue;
            this.controlValue = value;
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
        var transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        _super.prototype.patchValue.call(this, transformedValue, options);
    };
    SubFormGroup.prototype.patchValue = function (value, options) {
        if (options === void 0) { options = {}; }
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
        var transformedValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        _super.prototype.patchValue.call(this, transformedValue, options);
    };
    SubFormGroup.prototype.reset = function (value, options) {
        if (value === void 0) { value = {}; }
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
        // special handling for array sub-forms
        if (Array.isArray(value)) {
            this.controlValue = (value || []);
        }
        else {
            this.controlValue = __assign(__assign({}, this.controlValue), value);
        }
        var formValue = this.transformToFormGroup(value, this.getDefaultValues());
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(this.controlValue);
        _super.prototype.reset.call(this, formValue, options);
        // const controlValue = (this.transformFromFormGroup((value as unknown) as TForm) as unknown) as TControl;
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
        if (!this.subForm) {
            return;
        }
        var formValue = {};
        try {
            for (var _b = __values(Object.entries(this.subForm.formGroup.controls)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                var control = value;
                formValue[key] = this.getControlValue(control);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var controlValue = this.transformFromFormGroup(formValue || {});
        this.controlValue = controlValue;
        if (this.isRoot) {
            return;
        }
        var parentSubFromGroup;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQStCQSxDQUFDO0lBekJDLHVDQUFVLEdBQVYsVUFBVyxPQUE2QztRQUF4RCxpQkFRQztRQVBDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxVQUFDLEdBQW9CLEVBQUUsYUFBNkI7WUFDOUUsT0FBTyxLQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxJQUFLLEVBQVksQ0FBQztRQUNuRixDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELGlDQUFJLEdBQUosVUFBSyxLQUFnQjtRQUNuQiwyRUFBMkU7UUFDM0Usc0RBQXNEO1FBQ3RELDBGQUEwRjtRQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFNLGdCQUFnQixHQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBRSxLQUFnQyxFQUFFLEVBQUUsQ0FBeUIsQ0FBQztRQUVuSCwyQ0FBMkM7UUFDM0MsMERBQTBEO1FBRTFELE9BQU8saUJBQU0sSUFBSSxZQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEMsQ0FBQztJ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LFNBQVMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQUF4RUQsQ0FBOEQsU0FBUyxHQXdFdEUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudEVtaXR0ZXIsIENoYW5nZURldGVjdG9yUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1Hcm91cCxcclxuICBWYWxpZGF0b3JGbixcclxuICBGb3JtQ29udHJvbCxcclxuICBGb3JtQXJyYXksXHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuXHJcbmltcG9ydCB7IE5neFN1YkZvcm1Db21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5cclxuY2xhc3MgQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEV2ZW50RW1pdHRlcjxUQ29udHJvbD4ge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG4gIH1cclxuXHJcbiAgZW1pdCh2YWx1ZT86IFRDb250cm9sKTogdm9pZCB7XHJcbiAgICAvLyBhbGwgdGhvc2Ugd291bGQgaGFwcGVuIHdoaWxlIHRoZSBzdWItZm9ybSB0cmVlIGlzIHN0aWxsIGJlaW5nIGluaXRhbGl6ZWRcclxuICAgIC8vIHdlIGNhbiBzYWZlbHkgaWdub3JlIGFsbCBlbWl0cyB1bnRpbCBzdWJGb3JtIGlzIHNldFxyXG4gICAgLy8gc2luY2UgaW4gbmdPbkluaXQgb2Ygc3ViLWZvcm0tY29tcG9uZW50IGJhc2UgY2xhc3Mgd2UgY2FsbCByZXNldCB3aXRoIHRoZSBpbnRpYWwgdmFsdWVzXHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyBhbnkpIGFzIFRDb250cm9sIHwgbnVsbCwge30pIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIC8vIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyh0cmFuc2Zvcm1lZFZhbHVlKTtcclxuXHJcbiAgICByZXR1cm4gc3VwZXIuZW1pdCh0cmFuc2Zvcm1lZFZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUdyb3VwIHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHB1YmxpYyBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBpc1Jvb3QgPSBmYWxzZTtcclxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHB1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbDtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHZhbHVlOiBQYXJ0aWFsPFRDb250cm9sPiB8IG51bGwsXHJcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCxcclxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwsXHJcbiAgICAvL0BPcHRpb25hbCgpIEBJbmplY3QoU1VCX0ZPUk1fQ09NUE9ORU5UX1RPS0VOKSBwdWJsaWMgcGFyZW50U3ViRm9ybT86IE5neFN1YkZvcm1Db21wb25lbnQ8YW55PixcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoe30pO1xyXG5cclxuICAgIC8vIHRoaXMgaXMgaG93IHRvIG92ZXJ3cml0ZSBhIHByb3BldG90eXBlIHByb3BlcnR5XHJcbiAgICAvLyAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmb28sIFwiYmFyXCIsIHtcclxuICAgIC8vICAgICAvLyBvbmx5IHJldHVybnMgb2RkIGRpZSBzaWRlc1xyXG4gICAgLy8gICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKE1hdGgucmFuZG9tKCkgKiA2KSB8IDE7IH1cclxuICAgIC8vIH0pO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gKHZhbHVlIHx8IHVuZGVmaW5lZCkgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG5cclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG4gIH1cclxuXHJcbiAgc2V0Q2hhbmdlRGV0ZWN0b3IoY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XHJcbiAgICB0aGlzLmNkID0gY2Q7XHJcbiAgfVxyXG5cclxuICBnZXQgdmFsdWUoKSB7XHJcbiAgICAvLyBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgLy8gICByZXR1cm4gbnVsbDtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChcclxuICAgIC8vICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgYXMgVEZvcm0sXHJcbiAgICAvLyApIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgLy8gcmV0dXJuIHRyYW5zZm9ybWVkVmFsdWU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29udHJvbFZhbHVlO1xyXG4gIH1cclxuXHJcbiAgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyByZXRoaW5rIGFzIHRoaXMgbWlnaHQgbm90IHdvcmsgYXMgd2Ugd2FudCBpdCwgd2UgbWlnaHQgbm90IGV2ZW4gbmVlZCB0aGlzIGFueW1vcmVcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIChzdXBlci52YWx1ZSBhcyBhbnkpID0gdHJhbnNmb3JtZWRWYWx1ZTtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICBpZiAodGhpcy5yb290ID09PSB0aGlzKSB7XHJcbiAgICAgIHRoaXMuaXNSb290ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0cmFuc2Zvcm0gdG8gZm9ybSBncm91cCBzaG91bGQgbmV2ZXIgcmV0dXJuIG51bGwgLyB1bmRlZmluZWQgYnV0IHt9IGluc3RlYWRcclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcyA9IHRoaXMuc3ViRm9ybVsnZ2V0RGVmYXVsdFZhbHVlcyddLmJpbmQodGhpcy5zdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIGdldFJhd1ZhbHVlKCk6IGFueSB7XHJcbiAgICBjb25zdCByYXdWYWx1ZSA9IHN1cGVyLmdldFJhd1ZhbHVlKCk7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKHJhd1ZhbHVlKTtcclxuICB9XHJcblxyXG4gIHNldFZhbHVlKHZhbHVlOiBUQ29udHJvbCwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgd2hlbiB0aGUgcGFyZW50IHNldHMgYSB2YWx1ZSBidXQgdGhlIHN1Yi1mb3JtLWNvbXBvbmVudCBoYXMgbm90IHR1biBuZ09uSW5pdCB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLmNvbnRyb2xWYWx1ZSwgLi4udmFsdWUgfTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyh0aGlzLmNvbnRyb2xWYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh0cmFuc2Zvcm1lZFZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHBhdGNoVmFsdWUodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+LCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRoaXMuY29udHJvbFZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKHRyYW5zZm9ybWVkVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcmVzZXQodmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+ID0ge30sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gcmVzZXQgaXMgdHJpZ2dlcmVkIGZyb20gcGFyZW50IHdoZW4gZm9ybWdyb3VwIGlzIGNyZWF0ZWRcclxuICAgIC8vIHRoZW4gYWdhaW4gZnJvbSBzdWItZm9ybSBpbnNpZGUgbmdPbkluaXQgYWZ0ZXIgc3ViRm9ybSB3YXMgc2V0XHJcbiAgICAvLyBzbyB3aGVuIGNhbiBzYWZlbHkgaWdub3JlIHJlc2V0cyBwcmlvciB0byBzdWJGb3JtIGJlaW5nIHNldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3BlY2lhbCBoYW5kbGluZyBmb3IgYXJyYXkgc3ViLWZvcm1zXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgW10pIGFzIGFueTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLmNvbnRyb2xWYWx1ZSwgLi4udmFsdWUgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgICAgKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLFxyXG4gICAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKSxcclxuICAgICkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRoaXMuY29udHJvbFZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5yZXNldChmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIGNvbnN0IGNvbnRyb2xWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRGb3JtKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0Q29udHJvbFZhbHVlKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IGFueSB7XHJcbiAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gY29udHJvbC5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2UgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtQXJyYXkpIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbHMubWFwKGFycmF5RWxlbWVudENvbnRyb2wgPT4gdGhpcy5nZXRDb250cm9sVmFsdWUoYXJyYXlFbGVtZW50Q29udHJvbCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wudmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVWYWx1ZShvcHRpb25zOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB7fSBhcyBhbnk7XHJcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLmNvbnRyb2xzKSkge1xyXG4gICAgICBjb25zdCBjb250cm9sID0gdmFsdWUgYXMgQWJzdHJhY3RDb250cm9sO1xyXG4gICAgICBmb3JtVmFsdWVba2V5XSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGNvbnRyb2wpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlIHx8ICh7fSBhcyBURm9ybSkpIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xyXG5cclxuICAgIGlmICh0aGlzLmlzUm9vdCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBhcmVudFN1YkZyb21Hcm91cDogYW55O1xyXG4gICAgLy8gaWYgKHRoaXMucGFyZW50IGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAvLyAgIHBhcmVudFN1YkZyb21Hcm91cCA9IHRoaXMucGFyZW50LnBhcmVudDtcclxuICAgIC8vIH0gZWxzZSB7XHJcbiAgICBwYXJlbnRTdWJGcm9tR3JvdXAgPSB0aGlzLnBhcmVudDtcclxuICAgIC8vfVxyXG5cclxuICAgIGlmICghcGFyZW50U3ViRnJvbUdyb3VwKSB7XHJcbiAgICAgIGRlYnVnZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmVudFN1YkZyb21Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIC8vdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdGlvbnMpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGhpcyBpZGVhIG9mIHRoaXMgaXMgdGhhdCB3aGVuIGEgbm9uIHN1YiBmb3JtIGdyb3VwIGlzIGJlaW5nIHVwZGF0ZWQgdGhlIHN1YiBmb3JtIGdyb3VwIG5lZWRzIHRvIGJlIG5vdGlmZWRcclxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRm9ybUNvbnRyb2w8VENvbnRyb2wsIFRGb3JtPihzdWJGb3JtR3JvdXA6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+LCBjb250cm9sOiBGb3JtQ29udHJvbCkge1xyXG4gIGNvbnN0IHBhdGNoYWJsZUNvbnRyb2wgPSBjb250cm9sIGFzIEZvcm1Db250cm9sICYgeyBpc1BhdGNoZWQ6IGJvb2xlYW4gfTtcclxuXHJcbiAgaWYgKCFwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCkge1xyXG4gICAgY29uc3Qgc2V0VmFsdWUgPSBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlLmJpbmQocGF0Y2hhYmxlQ29udHJvbCk7XHJcbiAgICBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlID0gKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgICBzZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgIHN1YkZvcm1Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIH07XHJcbiAgICBwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUFycmF5PFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1BcnJheSB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgLy9wdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2xbXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPixcclxuICAgIGNvbnRyb2xzOiBBYnN0cmFjdENvbnRyb2xbXSxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoY29udHJvbHMpO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG5cclxuICAgIHRoaXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcblxyXG4gICAgLy8gZm9yIHNvbWUgcmVhc29uIHJvb3QgaXMgbm90IHByb3Blcmx5IHNldCBmb3IgZm9ybSBhcnJheVxyXG4gICAgLy8gb24gdGhlIG90aGVyIGhhbmQgZm9ybSBhcnJheSBzaG91bGQgbmV2ZXIgYmUgcm9vdCBhbnl3YXkgc28gd2UgY2FuIGlnbm9yZSB0aHNpIGZvciBub3dcclxuICAgIC8vIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgIC8vICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICBzdXBlci5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgKCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwIGFzIHVua25vd24pIGFzIFN1YkZvcm1Hcm91cDxhbnk+KS51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgICh0aGlzLnBhcmVudCBhcyBhbnkpLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVBdChpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVBdChpbmRleCk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==