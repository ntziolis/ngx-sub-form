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
            var formValue = this.transformToFormGroup(value, {});
            // TODO rethink as this might not work as we want it, we might not even need this anymore
            // @ts-ignore
            _super.prototype.value = formValue;
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
        // if value is an array skip merging with default values
        if (Array.isArray(value)) {
            this.controlValue = value;
        }
        else {
            this.controlValue = __assign(__assign({}, this.transformFromFormGroup(defaultValues)), value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQStCQSxDQUFDO0lBekJDLHVDQUFVLEdBQVYsVUFBVyxPQUE2QztRQUF4RCxpQkFRQztRQVBDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxVQUFDLEdBQW9CLEVBQUUsYUFBNkI7WUFDOUUsT0FBTyxLQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxJQUFLLEVBQVksQ0FBQztRQUNuRixDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELGlDQUFJLEdBQUosVUFBSyxLQUFnQjtRQUNuQiwyRUFBMkU7UUFDM0Usc0RBQXNEO1FBQ3RELDBGQUEwRjtRQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFNLGdCQUFnQixHQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBRSxLQUFnQyxFQUFFLEVBQUUsQ0FBeUIsQ0FBQztRQUVuSCwyQ0FBMkM7UUFDM0MsMERBQTBEO1FBRTFELE9BQU8saUJBQU0sSUFBSSxZQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEMsQ0FBQztJ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Q0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsK0JBQVEsR0FBUixVQUFTLEtBQVUsRUFBRSxPQUFZO1FBQy9CLGlCQUFNLFFBQVEsWUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsaUNBQVUsR0FBVixVQUFXLEtBQVUsRUFBRSxPQUFZO1FBQ2pDLGlCQUFNLFVBQVUsWUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsa0NBQVcsR0FBWCxVQUFZLE9BQVk7UUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDakIsT0FBTztTQUNSO1FBRUEsSUFBSSxDQUFDLE1BQWMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsdUNBQXVDO0lBQ3pDLENBQUM7SUFFRCwrQkFBUSxHQUFSLFVBQVMsS0FBYTtRQUNwQixpQkFBTSxRQUFRLFlBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUEyQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBeEVELENBQThELFNBQVMsR0F3RXRFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBDaGFuZ2VEZXRlY3RvclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtR3JvdXAsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgRm9ybUFycmF5LFxyXG4gIEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcblxyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtQ29tcG9uZW50IH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50JztcclxuXHJcbmNsYXNzIEN1c3RvbUV2ZW50RW1pdHRlcjxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBFdmVudEVtaXR0ZXI8VENvbnRyb2w+IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIGdldERlZmF1bHRWYWx1ZXMhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuICB9XHJcblxyXG4gIGVtaXQodmFsdWU/OiBUQ29udHJvbCk6IHZvaWQge1xyXG4gICAgLy8gYWxsIHRob3NlIHdvdWxkIGhhcHBlbiB3aGlsZSB0aGUgc3ViLWZvcm0gdHJlZSBpcyBzdGlsbCBiZWluZyBpbml0YWxpemVkXHJcbiAgICAvLyB3ZSBjYW4gc2FmZWx5IGlnbm9yZSBhbGwgZW1pdHMgdW50aWwgc3ViRm9ybSBpcyBzZXRcclxuICAgIC8vIHNpbmNlIGluIG5nT25Jbml0IG9mIHN1Yi1mb3JtLWNvbXBvbmVudCBiYXNlIGNsYXNzIHdlIGNhbGwgcmVzZXQgd2l0aCB0aGUgaW50aWFsIHZhbHVlc1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgYW55KSBhcyBUQ29udHJvbCB8IG51bGwsIHt9KSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICAvLyB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHModHJhbnNmb3JtZWRWYWx1ZSk7XHJcblxyXG4gICAgcmV0dXJuIHN1cGVyLmVtaXQodHJhbnNmb3JtZWRWYWx1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1Hcm91cCB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwdWJsaWMgY2Q6IENoYW5nZURldGVjdG9yUmVmIHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICBwdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2w7XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIGdldERlZmF1bHRWYWx1ZXMhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudFZhbGlkYXRvck9yT3B0czogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudEFzeW5jVmFsaWRhdG9yOiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICB2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4gfCBudWxsLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICAgLy9AT3B0aW9uYWwoKSBASW5qZWN0KFNVQl9GT1JNX0NPTVBPTkVOVF9UT0tFTikgcHVibGljIHBhcmVudFN1YkZvcm0/OiBOZ3hTdWJGb3JtQ29tcG9uZW50PGFueT4sXHJcbiAgKSB7XHJcbiAgICAvLyBpdHMgaW1wb3J0YW50IHRvIE5PVCBzZXQgdmFsaWRhdG9ycyBoZXJlIGFzIHRoaXMgd2lsbCB0cmlnZ2VyIGNhbGxzIHRvIHZhbHVlIGJlZm9yZSBzZXRTdWJGb3JtIHdhcyBjYWxsZWRcclxuICAgIHN1cGVyKHt9KTtcclxuXHJcbiAgICAvLyB0aGlzIGlzIGhvdyB0byBvdmVyd3JpdGUgYSBwcm9wZXRvdHlwZSBwcm9wZXJ0eVxyXG4gICAgLy8gICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm9vLCBcImJhclwiLCB7XHJcbiAgICAvLyAgICAgLy8gb25seSByZXR1cm5zIG9kZCBkaWUgc2lkZXNcclxuICAgIC8vICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChNYXRoLnJhbmRvbSgpICogNikgfCAxOyB9XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSB8fCB1bmRlZmluZWQpIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuXHJcbiAgICAodGhpcy52YWx1ZUNoYW5nZXMgYXMgYW55KSA9IHRoaXMuX3ZhbHVlQ2hhbmdlcztcclxuXHJcbiAgICB0aGlzLnBhcmVudFZhbGlkYXRvck9yT3B0cyA9IHZhbGlkYXRvck9yT3B0cztcclxuICAgIHRoaXMucGFyZW50QXN5bmNWYWxpZGF0b3IgPSBhc3luY1ZhbGlkYXRvcjtcclxuICB9XHJcblxyXG4gIHNldENoYW5nZURldGVjdG9yKGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xyXG4gICAgdGhpcy5jZCA9IGNkO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHZhbHVlKCkge1xyXG4gICAgLy8gaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgIC8vICAgcmV0dXJuIG51bGw7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoXHJcbiAgICAvLyAgIChzdXBlci52YWx1ZSBhcyBhbnkpIGFzIFRGb3JtLFxyXG4gICAgLy8gKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIC8vIHJldHVybiB0cmFuc2Zvcm1lZFZhbHVlO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmNvbnRyb2xWYWx1ZTtcclxuICB9XHJcblxyXG4gIHNldCB2YWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyByZXRoaW5rIGFzIHRoaXMgbWlnaHQgbm90IHdvcmsgYXMgd2Ugd2FudCBpdCwgd2UgbWlnaHQgbm90IGV2ZW4gbmVlZCB0aGlzIGFueW1vcmVcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIChzdXBlci52YWx1ZSBhcyBhbnkpID0gZm9ybVZhbHVlO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmF3VmFsdWUoKTogVENvbnRyb2wge1xyXG4gICAgY29uc3QgcmF3VmFsdWUgPSBzdXBlci5nZXRSYXdWYWx1ZSgpO1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChyYXdWYWx1ZSkgYXMgVENvbnRyb2w7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogVENvbnRyb2wsIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCBydW4gbmdDaGFuZ2VzIHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZShmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCB0dW4gbmdPbkluaXQgeWV0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4udGhpcy5jb250cm9sVmFsdWUsIC4uLnZhbHVlIH07XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKCh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbCwge30pIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUoZm9ybVZhbHVlLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlc2V0KHZhbHVlPzogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gcmVzZXQgaXMgdHJpZ2dlcmVkIGZyb20gcGFyZW50IHdoZW4gZm9ybWdyb3VwIGlzIGNyZWF0ZWRcclxuICAgIC8vIHRoZW4gYWdhaW4gZnJvbSBzdWItZm9ybSBpbnNpZGUgbmdPbkluaXQgYWZ0ZXIgc3ViRm9ybSB3YXMgc2V0XHJcbiAgICAvLyBzbyB3aGVuIGNhbiBzYWZlbHkgaWdub3JlIHJlc2V0cyBwcmlvciB0byBzdWJGb3JtIGJlaW5nIHNldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZSBhcyBUQ29udHJvbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpIGFzIFRGb3JtO1xyXG4gICAgLy8gaWYgdmFsdWUgaXMgYW4gYXJyYXkgc2tpcCBtZXJnaW5nIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyksIC4uLnZhbHVlIH0gYXMgVENvbnRyb2w7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAodGhpcy5jb250cm9sVmFsdWUsIGRlZmF1bHRWYWx1ZXMpIGFzIHVua25vd24pIGFzIFRGb3JtO1xyXG5cclxuICAgIC8vIFRPRE8gZmlndXJlIG91dCBob3cgdG8gaGFuZGxlIGZvciBhcnJheXNcclxuICAgIHRoaXMuc3ViRm9ybS5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnJlc2V0KGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldENvbnRyb2xWYWx1ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBhbnkge1xyXG4gICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIGNvbnRyb2wuY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUFycmF5KSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLmNvbnRyb2xzLm1hcChhcnJheUVsZW1lbnRDb250cm9sID0+IHRoaXMuZ2V0Q29udHJvbFZhbHVlKGFycmF5RWxlbWVudENvbnRyb2wpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLnZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0ge30gYXMgYW55O1xyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9scykpIHtcclxuICAgICAgY29uc3QgY29udHJvbCA9IHZhbHVlIGFzIEFic3RyYWN0Q29udHJvbDtcclxuICAgICAgZm9ybVZhbHVlW2tleV0gPSB0aGlzLmdldENvbnRyb2xWYWx1ZShjb250cm9sKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZSB8fCAoe30gYXMgVEZvcm0pKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHJcbiAgICBpZiAodGhpcy5pc1Jvb3QpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50IGFzIFN1YkZvcm1Hcm91cDxhbnksIGFueT4gfCBTdWJGb3JtQXJyYXk8YW55LCBhbnk+O1xyXG4gICAgcGFyZW50LnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0aGlzIGlkZWEgb2YgdGhpcyBpcyB0aGF0IHdoZW4gYSBub24gc3ViIGZvcm0gZ3JvdXAgaXMgYmVpbmcgdXBkYXRlZCB0aGUgc3ViIGZvcm0gZ3JvdXAgbmVlZHMgdG8gYmUgbm90aWZlZFxyXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hGb3JtQ29udHJvbDxUQ29udHJvbCwgVEZvcm0+KHN1YkZvcm1Hcm91cDogU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybT4sIGNvbnRyb2w6IEZvcm1Db250cm9sKSB7XHJcbiAgY29uc3QgcGF0Y2hhYmxlQ29udHJvbCA9IGNvbnRyb2wgYXMgRm9ybUNvbnRyb2wgJiB7IGlzUGF0Y2hlZDogYm9vbGVhbiB9O1xyXG5cclxuICBpZiAoIXBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkKSB7XHJcbiAgICBjb25zdCBzZXRWYWx1ZSA9IHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUuYmluZChwYXRjaGFibGVDb250cm9sKTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuc2V0VmFsdWUgPSAodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSA9PiB7XHJcbiAgICAgIHNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICAgc3ViRm9ybUdyb3VwLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgfTtcclxuICAgIHBhdGNoYWJsZUNvbnRyb2wuaXNQYXRjaGVkID0gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtQXJyYXk8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRm9ybUFycmF5IHtcclxuICBwcml2YXRlIHN1YkZvcm0hOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT47XHJcblxyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICAvL3B1YmxpYyBjb250cm9sVmFsdWUhOiBUQ29udHJvbFtdO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+LFxyXG4gICAgY29udHJvbHM6IEFic3RyYWN0Q29udHJvbFtdLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcihjb250cm9scyk7XHJcblxyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzID0gbmV3IEN1c3RvbUV2ZW50RW1pdHRlcigpO1xyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcblxyXG4gICAgdGhpcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0U3ViRm9ybShzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4pIHtcclxuICAgIHRoaXMuc3ViRm9ybSA9IHN1YkZvcm07XHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuXHJcbiAgICAvLyBmb3Igc29tZSByZWFzb24gcm9vdCBpcyBub3QgcHJvcGVybHkgc2V0IGZvciBmb3JtIGFycmF5XHJcbiAgICAvLyBvbiB0aGUgb3RoZXIgaGFuZCBmb3JtIGFycmF5IHNob3VsZCBuZXZlciBiZSByb290IGFueXdheSBzbyB3ZSBjYW4gaWdub3JlIHRoc2kgZm9yIG5vd1xyXG4gICAgLy8gaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgLy8gICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkge1xyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgKHRoaXMucGFyZW50IGFzIGFueSkudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlbW92ZUF0KGluZGV4KTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuIl19