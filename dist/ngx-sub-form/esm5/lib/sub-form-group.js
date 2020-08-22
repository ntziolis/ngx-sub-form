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
                if (control instanceof SubFormGroup) {
                    formValue[key] = control.controlValue;
                }
                else {
                    formValue[key] = control.value;
                }
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
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQStCQSxDQUFDO0lBekJDLHVDQUFVLEdBQVYsVUFBVyxPQUE2QztRQUF4RCxpQkFRQztRQVBDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxVQUFDLEdBQW9CLEVBQUUsYUFBNkI7WUFDOUUsT0FBTyxLQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxJQUFLLEVBQVksQ0FBQztRQUNuRixDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELGlDQUFJLEdBQUosVUFBSyxLQUFnQjtRQUNuQiwyRUFBMkU7UUFDM0Usc0RBQXNEO1FBQ3RELDBGQUEwRjtRQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPO1NBQ1I7UUFFRCxJQUFNLGdCQUFnQixHQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBRSxLQUFnQyxFQUFFLEVBQUUsQ0FBeUIsQ0FBQztRQUVuSCwyQ0FBMkM7UUFDM0MsMERBQTBEO1FBRTFELE9BQU8saUJBQU0sSUFBSSxZQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEMsQ0FBQztJ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QUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELCtCQUFRLEdBQVIsVUFBUyxLQUFVLEVBQUUsT0FBWTtRQUMvQixpQkFBTSxRQUFRLFlBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELGlDQUFVLEdBQVYsVUFBVyxLQUFVLEVBQUUsT0FBWTtRQUNqQyxpQkFBTSxVQUFVLFlBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELGtDQUFXLEdBQVgsVUFBWSxPQUFZO1FBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVBLElBQUksQ0FBQyxNQUFjLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLHVDQUF1QztJQUN6QyxDQUFDO0lBRUQsK0JBQVEsR0FBUixVQUFTLEtBQWE7UUFDcEIsaUJBQU0sUUFBUSxZQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQXhFRCxDQUE4RCxTQUFTLEdBd0V0RSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciwgQ2hhbmdlRGV0ZWN0b3JSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUdyb3VwLFxyXG4gIFZhbGlkYXRvckZuLFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIEZvcm1BcnJheSxcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5cclxuaW1wb3J0IHsgTmd4U3ViRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLmNvbXBvbmVudCc7XHJcblxyXG5jbGFzcyBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRXZlbnRFbWl0dGVyPFRDb250cm9sPiB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ107XHJcbiAgfVxyXG5cclxuICBlbWl0KHZhbHVlPzogVENvbnRyb2wpOiB2b2lkIHtcclxuICAgIC8vIGFsbCB0aG9zZSB3b3VsZCBoYXBwZW4gd2hpbGUgdGhlIHN1Yi1mb3JtIHRyZWUgaXMgc3RpbGwgYmVpbmcgaW5pdGFsaXplZFxyXG4gICAgLy8gd2UgY2FuIHNhZmVseSBpZ25vcmUgYWxsIGVtaXRzIHVudGlsIHN1YkZvcm0gaXMgc2V0XHJcbiAgICAvLyBzaW5jZSBpbiBuZ09uSW5pdCBvZiBzdWItZm9ybS1jb21wb25lbnQgYmFzZSBjbGFzcyB3ZSBjYWxsIHJlc2V0IHdpdGggdGhlIGludGlhbCB2YWx1ZXNcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIGFueSkgYXMgVENvbnRyb2wgfCBudWxsLCB7fSkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgLy8gdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRyYW5zZm9ybWVkVmFsdWUpO1xyXG5cclxuICAgIHJldHVybiBzdXBlci5lbWl0KHRyYW5zZm9ybWVkVmFsdWUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0gPSBUQ29udHJvbD4gZXh0ZW5kcyBGb3JtR3JvdXAge1xyXG4gIHByaXZhdGUgc3ViRm9ybSE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgcHVibGljIGNkOiBDaGFuZ2VEZXRlY3RvclJlZiB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgcHVibGljIGNvbnRyb2xWYWx1ZSE6IFRDb250cm9sO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVG9Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ107XHJcbiAgcHJpdmF0ZSBnZXREZWZhdWx0VmFsdWVzITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+WydnZXREZWZhdWx0VmFsdWVzJ107XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRWYWxpZGF0b3JPck9wdHM6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwgfCB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgdmFsdWU6IFBhcnRpYWw8VENvbnRyb2w+IHwgbnVsbCxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICAgIC8vQE9wdGlvbmFsKCkgQEluamVjdChTVUJfRk9STV9DT01QT05FTlRfVE9LRU4pIHB1YmxpYyBwYXJlbnRTdWJGb3JtPzogTmd4U3ViRm9ybUNvbXBvbmVudDxhbnk+LFxyXG4gICkge1xyXG4gICAgLy8gaXRzIGltcG9ydGFudCB0byBOT1Qgc2V0IHZhbGlkYXRvcnMgaGVyZSBhcyB0aGlzIHdpbGwgdHJpZ2dlciBjYWxscyB0byB2YWx1ZSBiZWZvcmUgc2V0U3ViRm9ybSB3YXMgY2FsbGVkXHJcbiAgICBzdXBlcih7fSk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyBob3cgdG8gb3ZlcndyaXRlIGEgcHJvcGV0b3R5cGUgcHJvcGVydHlcclxuICAgIC8vICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZvbywgXCJiYXJcIiwge1xyXG4gICAgLy8gICAgIC8vIG9ubHkgcmV0dXJucyBvZGQgZGllIHNpZGVzXHJcbiAgICAvLyAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiAoTWF0aC5yYW5kb20oKSAqIDYpIHwgMTsgfVxyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSAodmFsdWUgfHwgdW5kZWZpbmVkKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgQ3VzdG9tRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4gICAgKHRoaXMudmFsdWVDaGFuZ2VzIGFzIGFueSkgPSB0aGlzLl92YWx1ZUNoYW5nZXM7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRWYWxpZGF0b3JPck9wdHMgPSB2YWxpZGF0b3JPck9wdHM7XHJcbiAgICB0aGlzLnBhcmVudEFzeW5jVmFsaWRhdG9yID0gYXN5bmNWYWxpZGF0b3I7XHJcbiAgfVxyXG5cclxuICBzZXRDaGFuZ2VEZXRlY3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHRoaXMuY2QgPSBjZDtcclxuICB9XHJcblxyXG4gIGdldCB2YWx1ZSgpIHtcclxuICAgIC8vIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAvLyAgIHJldHVybiBudWxsO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKFxyXG4gICAgLy8gICAoc3VwZXIudmFsdWUgYXMgYW55KSBhcyBURm9ybSxcclxuICAgIC8vICkgYXMgdW5rbm93bikgYXMgVENvbnRyb2w7XHJcbiAgICAvLyByZXR1cm4gdHJhbnNmb3JtZWRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb250cm9sVmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIHJldGhpbmsgYXMgdGhpcyBtaWdodCBub3Qgd29yayBhcyB3ZSB3YW50IGl0LCB3ZSBtaWdodCBub3QgZXZlbiBuZWVkIHRoaXMgYW55bW9yZVxyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgKHN1cGVyLnZhbHVlIGFzIGFueSkgPSB0cmFuc2Zvcm1lZFZhbHVlO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgZ2V0UmF3VmFsdWUoKTogYW55IHtcclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gc3VwZXIuZ2V0UmF3VmFsdWUoKTtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAocmF3VmFsdWUpO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IFRDb250cm9sLCBvcHRpb25zOiB7IG9ubHlTZWxmPzogYm9vbGVhbjsgZW1pdEV2ZW50PzogYm9vbGVhbiB9ID0ge30pOiB2b2lkIHtcclxuICAgIC8vIHRoaXMgaGFwcGVucyB3aGVuIHRoZSBwYXJlbnQgc2V0cyBhIHZhbHVlIGJ1dCB0aGUgc3ViLWZvcm0tY29tcG9uZW50IGhhcyBub3QgdHVuIG5nT25Jbml0IHlldFxyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRoaXMuY29udHJvbFZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKHRyYW5zZm9ybWVkVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4sIG9wdGlvbnM6IHsgb25seVNlbGY/OiBib29sZWFuOyBlbWl0RXZlbnQ/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gdGhlIHBhcmVudCBzZXRzIGEgdmFsdWUgYnV0IHRoZSBzdWItZm9ybS1jb21wb25lbnQgaGFzIG5vdCB0dW4gbmdPbkluaXQgeWV0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHsgLi4udGhpcy5jb250cm9sVmFsdWUsIC4uLnZhbHVlIH07XHJcblxyXG4gICAgLy8gVE9ETyBjaGVjayBpZiBwcm92aWRpbmcge30gZG9lcyB3b3JrLCBhcyB3ZSBkbyBub3Qgd2FudCB0byBvdmVycmlkZSBleGlzdGluZyB2YWx1ZXMgd2l0aCBkZWZhdWx0IHZhbHVlc1xyXG4gICAgLy8gSXQgbWlnaHQgYmUgdGhhdCBwYXRjaFZhbHVlIGNhbm5vdCBiZSB1c2VkIGFzIHdlIGRvbnQgaGF2ZSBjb250cm9sIG92ZXIgaG93IHRyYW5zZm9ybVRvRm9ybUdyb3VwIGlzIGltcGxlbWVudGVkXHJcbiAgICAvLyBpdCB3b3VsZCBoYXZlIHRvIGJlIGRvbmUgaW4gYSB3YXkgdGhhdCByZXR1cm5zIGEgcGFydGlhbCBURm9ybSB3aGljaCByaWdodCBub3cgaXMgbm90IGhvdyB0aGUgbWV0aG9kIHNpZ25hdHVyZXMgYXJlIGRlZmluZWRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHModGhpcy5jb250cm9sVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodHJhbnNmb3JtZWRWYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZXNldCh2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4gPSB7fSwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyByZXNldCBpcyB0cmlnZ2VyZWQgZnJvbSBwYXJlbnQgd2hlbiBmb3JtZ3JvdXAgaXMgY3JlYXRlZFxyXG4gICAgLy8gdGhlbiBhZ2FpbiBmcm9tIHN1Yi1mb3JtIGluc2lkZSBuZ09uSW5pdCBhZnRlciBzdWJGb3JtIHdhcyBzZXRcclxuICAgIC8vIHNvIHdoZW4gY2FuIHNhZmVseSBpZ25vcmUgcmVzZXRzIHByaW9yIHRvIHN1YkZvcm0gYmVpbmcgc2V0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzcGVjaWFsIGhhbmRsaW5nIGZvciBhcnJheSBzdWItZm9ybXNcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSB8fCBbXSkgYXMgYW55O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSB7IC4uLnRoaXMuY29udHJvbFZhbHVlLCAuLi52YWx1ZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgICAodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsXHJcbiAgICAgIHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpLFxyXG4gICAgKSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHModGhpcy5jb250cm9sVmFsdWUpO1xyXG5cclxuICAgIHN1cGVyLnJlc2V0KGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gY29uc3QgY29udHJvbFZhbHVlID0gKHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVEZvcm0pIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0ge30gYXMgYW55O1xyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9scykpIHtcclxuICAgICAgY29uc3QgY29udHJvbCA9IHZhbHVlIGFzIEFic3RyYWN0Q29udHJvbDtcclxuICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApIHtcclxuICAgICAgICBmb3JtVmFsdWVba2V5XSA9IGNvbnRyb2wuY29udHJvbFZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZvcm1WYWx1ZVtrZXldID0gY29udHJvbC52YWx1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlIHx8ICh7fSBhcyBURm9ybSkpIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xyXG5cclxuICAgIGlmICh0aGlzLmlzUm9vdCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBhcmVudFN1YkZyb21Hcm91cDogYW55O1xyXG4gICAgLy8gaWYgKHRoaXMucGFyZW50IGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAvLyAgIHBhcmVudFN1YkZyb21Hcm91cCA9IHRoaXMucGFyZW50LnBhcmVudDtcclxuICAgIC8vIH0gZWxzZSB7XHJcbiAgICBwYXJlbnRTdWJGcm9tR3JvdXAgPSB0aGlzLnBhcmVudDtcclxuICAgIC8vfVxyXG5cclxuICAgIGlmICghcGFyZW50U3ViRnJvbUdyb3VwKSB7XHJcbiAgICAgIGRlYnVnZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmVudFN1YkZyb21Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIC8vdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdGlvbnMpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGhpcyBpZGVhIG9mIHRoaXMgaXMgdGhhdCB3aGVuIGEgbm9uIHN1YiBmb3JtIGdyb3VwIGlzIGJlaW5nIHVwZGF0ZWQgdGhlIHN1YiBmb3JtIGdyb3VwIG5lZWRzIHRvIGJlIG5vdGlmZWRcclxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRm9ybUNvbnRyb2w8VENvbnRyb2wsIFRGb3JtPihzdWJGb3JtR3JvdXA6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+LCBjb250cm9sOiBGb3JtQ29udHJvbCkge1xyXG4gIGNvbnN0IHBhdGNoYWJsZUNvbnRyb2wgPSBjb250cm9sIGFzIEZvcm1Db250cm9sICYgeyBpc1BhdGNoZWQ6IGJvb2xlYW4gfTtcclxuXHJcbiAgaWYgKCFwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCkge1xyXG4gICAgY29uc3Qgc2V0VmFsdWUgPSBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlLmJpbmQocGF0Y2hhYmxlQ29udHJvbCk7XHJcbiAgICBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlID0gKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgICBzZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgIHN1YkZvcm1Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIH07XHJcbiAgICBwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUFycmF5PFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1BcnJheSB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgcHVibGljIGNvbnRyb2xWYWx1ZSE6IFRDb250cm9sW107XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIGdldERlZmF1bHRWYWx1ZXMhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudFZhbGlkYXRvck9yT3B0czogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudEFzeW5jVmFsaWRhdG9yOiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBzdWJGb3JtOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT4sXHJcbiAgICBjb250cm9sczogQWJzdHJhY3RDb250cm9sW10sXHJcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCxcclxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbiB8IEFzeW5jVmFsaWRhdG9yRm5bXSB8IG51bGwsXHJcbiAgKSB7XHJcbiAgICAvLyBpdHMgaW1wb3J0YW50IHRvIE5PVCBzZXQgdmFsaWRhdG9ycyBoZXJlIGFzIHRoaXMgd2lsbCB0cmlnZ2VyIGNhbGxzIHRvIHZhbHVlIGJlZm9yZSBzZXRTdWJGb3JtIHdhcyBjYWxsZWRcclxuICAgIHN1cGVyKGNvbnRyb2xzKTtcclxuXHJcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgQ3VzdG9tRXZlbnRFbWl0dGVyKCk7XHJcbiAgICAodGhpcy52YWx1ZUNoYW5nZXMgYXMgYW55KSA9IHRoaXMuX3ZhbHVlQ2hhbmdlcztcclxuXHJcbiAgICB0aGlzLnBhcmVudFZhbGlkYXRvck9yT3B0cyA9IHZhbGlkYXRvck9yT3B0cztcclxuICAgIHRoaXMucGFyZW50QXN5bmNWYWxpZGF0b3IgPSBhc3luY1ZhbGlkYXRvcjtcclxuXHJcbiAgICB0aGlzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcy5zZXRTdWJGb3JtKHN1YkZvcm0pO1xyXG5cclxuICAgIC8vIGZvciBzb21lIHJlYXNvbiByb290IGlzIG5vdCBwcm9wZXJseSBzZXQgZm9yIGZvcm0gYXJyYXlcclxuICAgIC8vIG9uIHRoZSBvdGhlciBoYW5kIGZvcm0gYXJyYXkgc2hvdWxkIG5ldmVyIGJlIHJvb3QgYW55d2F5IHNvIHdlIGNhbiBpZ25vcmUgdGhzaSBmb3Igbm93XHJcbiAgICAvLyBpZiAodGhpcy5yb290ID09PSB0aGlzKSB7XHJcbiAgICAvLyAgIHRoaXMuaXNSb290ID0gdHJ1ZTtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyB0cmFuc2Zvcm0gdG8gZm9ybSBncm91cCBzaG91bGQgbmV2ZXIgcmV0dXJuIG51bGwgLyB1bmRlZmluZWQgYnV0IHt9IGluc3RlYWRcclxuICAgIHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAgPSAob2JqOiBUQ29udHJvbCB8IG51bGwsIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8VEZvcm0+KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybVRvRm9ybUdyb3VwJ10ob2JqLCBkZWZhdWx0VmFsdWVzKSB8fCAoe30gYXMgVEZvcm0pO1xyXG4gICAgfTtcclxuICAgIHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cCA9IHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ107XHJcbiAgfVxyXG5cclxuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkge1xyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVmFsdWUob3B0aW9uczogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgKHRoaXMucGFyZW50IGFzIGFueSkudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlbW92ZUF0KGluZGV4KTtcclxuICAgICgodGhpcy5zdWJGb3JtLmZvcm1Hcm91cCBhcyB1bmtub3duKSBhcyBTdWJGb3JtR3JvdXA8YW55PikudXBkYXRlVmFsdWUodW5kZWZpbmVkKTtcclxuICB9XHJcbn1cclxuIl19