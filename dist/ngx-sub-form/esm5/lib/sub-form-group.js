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
        var _a;
        if (!this.subForm) {
            return;
        }
        var controlValue = this._reduceValue();
        this.controlValue = controlValue;
        // eith this is the root sub form or there is no root sub form
        if (((_a = options) === null || _a === void 0 ? void 0 : _a.self) || this.isRoot || !(this.parent instanceof SubFormGroup)) {
            return;
        }
        var parent = this.parent;
        parent.updateValue(options);
        //this.updateValueAndValidity(options);
    };
    SubFormGroup.prototype._reduceValue = function () {
        var e_1, _a;
        if (!this.subForm) {
            return null;
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
        return controlValue;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0tZ3JvdXAuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc3ViLWZvcm0tZ3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQXFCLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFHTCxTQUFTLEVBR1QsU0FBUyxHQUVWLE1BQU0sZ0JBQWdCLENBQUM7QUFJeEI7SUFBNkQsc0NBQXNCO0lBQW5GOztJQWlCQSxDQUFDO0lBZEMsdUNBQVUsR0FBVixVQUFXLE9BQTZDO1FBQ3RELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxpQ0FBSSxHQUFKLFVBQUssS0FBZ0I7UUFDbkIsNERBQTREO1FBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRW5ELGlCQUFNLElBQUksWUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0gseUJBQUM7QUFBRCxDQUFDLEFBakJELENBQTZELFlBQVksR0FpQnhFO0FBRUQ7SUFBOEQsZ0NBQVM7SUFjckUsc0JBQ0UsS0FBK0IsRUFDL0IsZUFBNkUsRUFDN0UsY0FBNkQ7UUFIL0Q7UUFNRSw0R0FBNEc7UUFDNUcsa0JBQU0sRUFBRSxDQUFDLFNBZ0JWO1FBakNPLFlBQU0sR0FBRyxLQUFLLENBQUM7UUFtQnJCLGtEQUFrRDtRQUNsRCx3Q0FBd0M7UUFDeEMsb0NBQW9DO1FBQ3BDLDJEQUEyRDtRQUMzRCxNQUFNO1FBRU4sS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQWEsQ0FBQztRQUVyRCxLQUFJLENBQUMs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LE9BQU87U0FDUjtRQUVBLElBQUksQ0FBQyxNQUFjLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLHVDQUF1QztJQUN6QyxDQUFDO0lBRUQsK0JBQVEsR0FBUixVQUFTLEtBQWE7UUFDcEIsaUJBQU0sUUFBUSxZQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBMkMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQXhFRCxDQUE4RCxTQUFTLEdBd0V0RSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciwgQ2hhbmdlRGV0ZWN0b3JSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUdyb3VwLFxyXG4gIFZhbGlkYXRvckZuLFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIEZvcm1BcnJheSxcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5cclxuaW1wb3J0IHsgTmd4U3ViRm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLmNvbXBvbmVudCc7XHJcblxyXG5jbGFzcyBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtID0gVENvbnRyb2w+IGV4dGVuZHMgRXZlbnRFbWl0dGVyPFRDb250cm9sPiB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBzZXRTdWJGb3JtKHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPikge1xyXG4gICAgdGhpcy5zdWJGb3JtID0gc3ViRm9ybTtcclxuICB9XHJcblxyXG4gIGVtaXQodmFsdWU/OiBUQ29udHJvbCk6IHZvaWQge1xyXG4gICAgLy8gaWdub3JlIGFsbCBlbWl0IHZhbHVlcyB1bnRpbCBzdWIgZm9ybSB0cmVlIGlzIGluaXRpYWxpemVkXHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdWJGb3JtLmZvcm1Hcm91cC51cGRhdGVWYWx1ZSh7IHNlbGY6IHRydWUgfSk7XHJcblxyXG4gICAgc3VwZXIuZW1pdCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwLmNvbnRyb2xWYWx1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1Hcm91cCB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwdWJsaWMgY2Q6IENoYW5nZURldGVjdG9yUmVmIHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgaXNSb290ID0gZmFsc2U7XHJcbiAgcHJpdmF0ZSBfdmFsdWVDaGFuZ2VzOiBDdXN0b21FdmVudEVtaXR0ZXI8VENvbnRyb2wsIFRGb3JtPjtcclxuICBwdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2w7XHJcbiAgcHJpdmF0ZSB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXTtcclxuICBwcml2YXRlIGdldERlZmF1bHRWYWx1ZXMhOiBOZ3hTdWJGb3JtQ29tcG9uZW50PFRDb250cm9sLCBURm9ybT5bJ2dldERlZmF1bHRWYWx1ZXMnXTtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudFZhbGlkYXRvck9yT3B0czogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudEFzeW5jVmFsaWRhdG9yOiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICB2YWx1ZTogUGFydGlhbDxUQ29udHJvbD4gfCBudWxsLFxyXG4gICAgdmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm4gfCBWYWxpZGF0b3JGbltdIHwgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB8IG51bGwsXHJcbiAgICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gICAgLy9AT3B0aW9uYWwoKSBASW5qZWN0KFNVQl9GT1JNX0NPTVBPTkVOVF9UT0tFTikgcHVibGljIHBhcmVudFN1YkZvcm0/OiBOZ3hTdWJGb3JtQ29tcG9uZW50PGFueT4sXHJcbiAgKSB7XHJcbiAgICAvLyBpdHMgaW1wb3J0YW50IHRvIE5PVCBzZXQgdmFsaWRhdG9ycyBoZXJlIGFzIHRoaXMgd2lsbCB0cmlnZ2VyIGNhbGxzIHRvIHZhbHVlIGJlZm9yZSBzZXRTdWJGb3JtIHdhcyBjYWxsZWRcclxuICAgIHN1cGVyKHt9KTtcclxuXHJcbiAgICAvLyB0aGlzIGlzIGhvdyB0byBvdmVyd3JpdGUgYSBwcm9wZXRvdHlwZSBwcm9wZXJ0eVxyXG4gICAgLy8gICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm9vLCBcImJhclwiLCB7XHJcbiAgICAvLyAgICAgLy8gb25seSByZXR1cm5zIG9kZCBkaWUgc2lkZXNcclxuICAgIC8vICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChNYXRoLnJhbmRvbSgpICogNikgfCAxOyB9XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9ICh2YWx1ZSB8fCB1bmRlZmluZWQpIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuXHJcbiAgICAodGhpcy52YWx1ZUNoYW5nZXMgYXMgYW55KSA9IHRoaXMuX3ZhbHVlQ2hhbmdlcztcclxuXHJcbiAgICB0aGlzLnBhcmVudFZhbGlkYXRvck9yT3B0cyA9IHZhbGlkYXRvck9yT3B0cztcclxuICAgIHRoaXMucGFyZW50QXN5bmNWYWxpZGF0b3IgPSBhc3luY1ZhbGlkYXRvcjtcclxuICB9XHJcblxyXG4gIHNldENoYW5nZURldGVjdG9yKGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xyXG4gICAgdGhpcy5jZCA9IGNkO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHZhbHVlKCkge1xyXG4gICAgLy8gaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgIC8vICAgcmV0dXJuIG51bGw7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoXHJcbiAgICAvLyAgIChzdXBlci52YWx1ZSBhcyBhbnkpIGFzIFRGb3JtLFxyXG4gICAgLy8gKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuICAgIC8vIHJldHVybiB0cmFuc2Zvcm1lZFZhbHVlO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmNvbnRyb2xWYWx1ZTtcclxuICB9XHJcblxyXG4gIC8vIHRoaXMgbWV0aG9kIGlzIGJlaW5nIGNhbGxlZCBmcm9tIGFuZ3VsYXIgY29kZSBvbmx5XHJcbiAgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRGb3JtKSBhcyBUQ29udHJvbDtcclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xyXG5cclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIChzdXBlci52YWx1ZSBhcyBhbnkpID0gY29udHJvbFZhbHVlO1xyXG4gICAgLy9jb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuICAgIC8vIFRPRE8gcmV0aGluayBhcyB0aGlzIG1pZ2h0IG5vdCB3b3JrIGFzIHdlIHdhbnQgaXQsIHdlIG1pZ2h0IG5vdCBldmVuIG5lZWQgdGhpcyBhbnltb3JlXHJcbiAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAvLyAoc3VwZXIudmFsdWUgYXMgYW55KSA9IGZvcm1WYWx1ZTtcclxuICAgIC8vdGhpcy5jb250cm9sVmFsdWUgPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcblxyXG4gICAgaWYgKHRoaXMucm9vdCA9PT0gdGhpcykge1xyXG4gICAgICB0aGlzLmlzUm9vdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHJhbnNmb3JtIHRvIGZvcm0gZ3JvdXAgc2hvdWxkIG5ldmVyIHJldHVybiBudWxsIC8gdW5kZWZpbmVkIGJ1dCB7fSBpbnN0ZWFkXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwID0gKG9iajogVENvbnRyb2wgfCBudWxsLCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPFRGb3JtPikgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddKG9iaiwgZGVmYXVsdFZhbHVlcykgfHwgKHt9IGFzIFRGb3JtKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAgPSB0aGlzLnN1YkZvcm1bJ3RyYW5zZm9ybUZyb21Gb3JtR3JvdXAnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgICB0aGlzLmdldERlZmF1bHRWYWx1ZXMgPSB0aGlzLnN1YkZvcm1bJ2dldERlZmF1bHRWYWx1ZXMnXS5iaW5kKHRoaXMuc3ViRm9ybSk7XHJcbiAgfVxyXG5cclxuICBnZXRSYXdWYWx1ZSgpOiBUQ29udHJvbCB7XHJcbiAgICBjb25zdCByYXdWYWx1ZSA9IHN1cGVyLmdldFJhd1ZhbHVlKCk7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKHJhd1ZhbHVlKSBhcyBUQ29udHJvbDtcclxuICB9XHJcblxyXG4gIHNldFZhbHVlKHZhbHVlOiBUQ29udHJvbCwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgd2hlbiB0aGUgcGFyZW50IHNldHMgYSB2YWx1ZSBidXQgdGhlIHN1Yi1mb3JtLWNvbXBvbmVudCBoYXMgbm90IHJ1biBuZ0NoYW5nZXMgeWV0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlO1xyXG5cclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgcHJvdmlkaW5nIHt9IGRvZXMgd29yaywgYXMgd2UgZG8gbm90IHdhbnQgdG8gb3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWVzIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIC8vIEl0IG1pZ2h0IGJlIHRoYXQgcGF0Y2hWYWx1ZSBjYW5ub3QgYmUgdXNlZCBhcyB3ZSBkb250IGhhdmUgY29udHJvbCBvdmVyIGhvdyB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCBpcyBpbXBsZW1lbnRlZFxyXG4gICAgLy8gaXQgd291bGQgaGF2ZSB0byBiZSBkb25lIGluIGEgd2F5IHRoYXQgcmV0dXJucyBhIHBhcnRpYWwgVEZvcm0gd2hpY2ggcmlnaHQgbm93IGlzIG5vdCBob3cgdGhlIG1ldGhvZCBzaWduYXR1cmVzIGFyZSBkZWZpbmVkXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCgodmFsdWUgYXMgdW5rbm93bikgYXMgVENvbnRyb2wsIHt9KSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5wYXRjaFZhbHVlKGZvcm1WYWx1ZSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBwYXRjaFZhbHVlKHZhbHVlOiBQYXJ0aWFsPFRDb250cm9sPiwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyB3aGVuIHZhbHVlIGlzIG51bGwgdHJlYXQgcGF0Y2ggdmFsdWUgYXMgc2V0IHZhbHVlXHJcbiAgICBpZiAoIXZhbHVlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldFZhbHVlKHZhbHVlLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgd2hlbiB0aGUgcGFyZW50IHNldHMgYSB2YWx1ZSBidXQgdGhlIHN1Yi1mb3JtLWNvbXBvbmVudCBoYXMgbm90IHR1biBuZ09uSW5pdCB5ZXRcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gdmFsdWUgYXMgVENvbnRyb2w7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi50aGlzLmNvbnRyb2xWYWx1ZSwgLi4udmFsdWUgfTtcclxuXHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHByb3ZpZGluZyB7fSBkb2VzIHdvcmssIGFzIHdlIGRvIG5vdCB3YW50IHRvIG92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlcyB3aXRoIGRlZmF1bHQgdmFsdWVzXHJcbiAgICAvLyBJdCBtaWdodCBiZSB0aGF0IHBhdGNoVmFsdWUgY2Fubm90IGJlIHVzZWQgYXMgd2UgZG9udCBoYXZlIGNvbnRyb2wgb3ZlciBob3cgdHJhbnNmb3JtVG9Gb3JtR3JvdXAgaXMgaW1wbGVtZW50ZWRcclxuICAgIC8vIGl0IHdvdWxkIGhhdmUgdG8gYmUgZG9uZSBpbiBhIHdheSB0aGF0IHJldHVybnMgYSBwYXJ0aWFsIFRGb3JtIHdoaWNoIHJpZ2h0IG5vdyBpcyBub3QgaG93IHRoZSBtZXRob2Qgc2lnbmF0dXJlcyBhcmUgZGVmaW5lZFxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gKHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAoKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sLCB7fSkgYXMgdW5rbm93bikgYXMgVEZvcm07XHJcblxyXG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBoYW5kbGUgZm9yIGFycmF5c1xyXG4gICAgdGhpcy5zdWJGb3JtLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgc3VwZXIucGF0Y2hWYWx1ZShmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcmVzZXQodmFsdWU/OiBQYXJ0aWFsPFRDb250cm9sPiwgb3B0aW9uczogeyBvbmx5U2VsZj86IGJvb2xlYW47IGVtaXRFdmVudD86IGJvb2xlYW4gfSA9IHt9KTogdm9pZCB7XHJcbiAgICAvLyByZXNldCBpcyB0cmlnZ2VyZWQgZnJvbSBwYXJlbnQgd2hlbiBmb3JtZ3JvdXAgaXMgY3JlYXRlZFxyXG4gICAgLy8gdGhlbiBhZ2FpbiBmcm9tIHN1Yi1mb3JtIGluc2lkZSBuZ09uSW5pdCBhZnRlciBzdWJGb3JtIHdhcyBzZXRcclxuICAgIC8vIHNvIHdoZW4gY2FuIHNhZmVseSBpZ25vcmUgcmVzZXRzIHByaW9yIHRvIHN1YkZvcm0gYmVpbmcgc2V0XHJcbiAgICBpZiAoIXRoaXMuc3ViRm9ybSkge1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IHZhbHVlIGFzIFRDb250cm9sO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCkgYXMgVEZvcm07XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzQXNDb250cm9sID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMpIGFzIFRDb250cm9sO1xyXG4gICAgLy8gaWYgdmFsdWUgaXMgYW4gYXJyYXkgc2tpcCBtZXJnaW5nIHdpdGggZGVmYXVsdCB2YWx1ZXNcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCBBcnJheS5pc0FycmF5KGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wpKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gKHZhbHVlIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgfSBlbHNlIGlmIChcclxuICAgICAgLy8gaW4ganMgbnVsbCBpcyBhbHNvIG9mIHR5cGUgb2JqZWN0XHJcbiAgICAgIC8vIGhlbmNlIHdlIG5lZWQgdG8gY2hlY2sgZm9yIG51bGwgYmVmb3JlIGNoZWNraW5nIGlmIGl0cyBvZiB0eXBlIG9iamVjdFxyXG4gICAgICAodmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgfHxcclxuICAgICAgKGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wgIT09IG51bGwgJiYgdHlwZW9mIGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wgPT09ICdvYmplY3QnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbFZhbHVlID0geyAuLi5kZWZhdWx0VmFsdWVzQXNDb250cm9sLCAuLi52YWx1ZSB9IGFzIFRDb250cm9sO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSAoKHZhbHVlIHx8IGRlZmF1bHRWYWx1ZXNBc0NvbnRyb2wpIGFzIHVua25vd24pIGFzIFRDb250cm9sO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9ICh0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKHRoaXMuY29udHJvbFZhbHVlLCBkZWZhdWx0VmFsdWVzKSBhcyB1bmtub3duKSBhcyBURm9ybTtcclxuXHJcbiAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSBmb3IgYXJyYXlzXHJcbiAgICB0aGlzLnN1YkZvcm0uaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICBzdXBlci5yZXNldChmb3JtVmFsdWUsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRDb250cm9sVmFsdWUoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogYW55IHtcclxuICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBjb250cm9sLmNvbnRyb2xWYWx1ZTtcclxuICAgIH0gZWxzZSBpZiAoY29udHJvbCBpbnN0YW5jZW9mIFN1YkZvcm1BcnJheSkge1xyXG4gICAgICByZXR1cm4gY29udHJvbC5jb250cm9scy5tYXAoYXJyYXlFbGVtZW50Q29udHJvbCA9PiB0aGlzLmdldENvbnRyb2xWYWx1ZShhcnJheUVsZW1lbnRDb250cm9sKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gY29udHJvbC52YWx1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM/OiB7IHNlbGY/OiBib29sZWFuIH0pIHtcclxuICAgIGlmICghdGhpcy5zdWJGb3JtKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLl9yZWR1Y2VWYWx1ZSgpIGFzIFRDb250cm9sO1xyXG5cclxuICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xyXG5cclxuICAgIC8vIGVpdGggdGhpcyBpcyB0aGUgcm9vdCBzdWIgZm9ybSBvciB0aGVyZSBpcyBubyByb290IHN1YiBmb3JtXHJcbiAgICBpZiAob3B0aW9ucz8uc2VsZiB8fCB0aGlzLmlzUm9vdCB8fCAhKHRoaXMucGFyZW50IGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnQgYXMgU3ViRm9ybUdyb3VwPGFueSwgYW55PiB8IFN1YkZvcm1BcnJheTxhbnksIGFueT47XHJcbiAgICBwYXJlbnQudXBkYXRlVmFsdWUob3B0aW9ucyk7XHJcbiAgICAvL3RoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIF9yZWR1Y2VWYWx1ZSgpOiBUQ29udHJvbCB8IG51bGwge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0ge30gYXMgYW55O1xyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5zdWJGb3JtLmZvcm1Hcm91cC5jb250cm9scykpIHtcclxuICAgICAgY29uc3QgY29udHJvbCA9IHZhbHVlIGFzIEFic3RyYWN0Q29udHJvbDtcclxuICAgICAgZm9ybVZhbHVlW2tleV0gPSB0aGlzLmdldENvbnRyb2xWYWx1ZShjb250cm9sKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250cm9sVmFsdWUgPSAodGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZSB8fCAoe30gYXMgVEZvcm0pKSBhcyB1bmtub3duKSBhcyBUQ29udHJvbDtcclxuXHJcbiAgICByZXR1cm4gY29udHJvbFZhbHVlO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGhpcyBpZGVhIG9mIHRoaXMgaXMgdGhhdCB3aGVuIGEgbm9uIHN1YiBmb3JtIGdyb3VwIGlzIGJlaW5nIHVwZGF0ZWQgdGhlIHN1YiBmb3JtIGdyb3VwIG5lZWRzIHRvIGJlIG5vdGlmZWRcclxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoRm9ybUNvbnRyb2w8VENvbnRyb2wsIFRGb3JtPihzdWJGb3JtR3JvdXA6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+LCBjb250cm9sOiBGb3JtQ29udHJvbCkge1xyXG4gIGNvbnN0IHBhdGNoYWJsZUNvbnRyb2wgPSBjb250cm9sIGFzIEZvcm1Db250cm9sICYgeyBpc1BhdGNoZWQ6IGJvb2xlYW4gfTtcclxuXHJcbiAgaWYgKCFwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCkge1xyXG4gICAgY29uc3Qgc2V0VmFsdWUgPSBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlLmJpbmQocGF0Y2hhYmxlQ29udHJvbCk7XHJcbiAgICBwYXRjaGFibGVDb250cm9sLnNldFZhbHVlID0gKHZhbHVlOiBhbnksIG9wdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgICBzZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgIHN1YkZvcm1Hcm91cC51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICAgIH07XHJcbiAgICBwYXRjaGFibGVDb250cm9sLmlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3ViRm9ybUFycmF5PFRDb250cm9sLCBURm9ybSA9IFRDb250cm9sPiBleHRlbmRzIEZvcm1BcnJheSB7XHJcbiAgcHJpdmF0ZSBzdWJGb3JtITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBwcml2YXRlIGlzUm9vdCA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3ZhbHVlQ2hhbmdlczogQ3VzdG9tRXZlbnRFbWl0dGVyPFRDb250cm9sLCBURm9ybT47XHJcbiAgLy9wdWJsaWMgY29udHJvbFZhbHVlITogVENvbnRyb2xbXTtcclxuICBwcml2YXRlIHRyYW5zZm9ybVRvRm9ybUdyb3VwITogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+Wyd0cmFuc2Zvcm1Ub0Zvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cCE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsndHJhbnNmb3JtRnJvbUZvcm1Hcm91cCddO1xyXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFZhbHVlcyE6IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPlsnZ2V0RGVmYXVsdFZhbHVlcyddO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50VmFsaWRhdG9yT3JPcHRzOiBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBBYnN0cmFjdENvbnRyb2xPcHRpb25zIHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50QXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHN1YkZvcm06IE5neFN1YkZvcm1Db21wb25lbnQ8VENvbnRyb2wsIFRGb3JtPixcclxuICAgIGNvbnRyb2xzOiBBYnN0cmFjdENvbnRyb2xbXSxcclxuICAgIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4gICAgYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbltdIHwgbnVsbCxcclxuICApIHtcclxuICAgIC8vIGl0cyBpbXBvcnRhbnQgdG8gTk9UIHNldCB2YWxpZGF0b3JzIGhlcmUgYXMgdGhpcyB3aWxsIHRyaWdnZXIgY2FsbHMgdG8gdmFsdWUgYmVmb3JlIHNldFN1YkZvcm0gd2FzIGNhbGxlZFxyXG4gICAgc3VwZXIoY29udHJvbHMpO1xyXG5cclxuICAgIHRoaXMuX3ZhbHVlQ2hhbmdlcyA9IG5ldyBDdXN0b21FdmVudEVtaXR0ZXIoKTtcclxuICAgICh0aGlzLnZhbHVlQ2hhbmdlcyBhcyBhbnkpID0gdGhpcy5fdmFsdWVDaGFuZ2VzO1xyXG5cclxuICAgIHRoaXMucGFyZW50VmFsaWRhdG9yT3JPcHRzID0gdmFsaWRhdG9yT3JPcHRzO1xyXG4gICAgdGhpcy5wYXJlbnRBc3luY1ZhbGlkYXRvciA9IGFzeW5jVmFsaWRhdG9yO1xyXG5cclxuICAgIHRoaXMuc2V0U3ViRm9ybShzdWJGb3JtKTtcclxuICB9XHJcblxyXG4gIHNldFN1YkZvcm0oc3ViRm9ybTogTmd4U3ViRm9ybUNvbXBvbmVudDxUQ29udHJvbCwgVEZvcm0+KSB7XHJcbiAgICB0aGlzLnN1YkZvcm0gPSBzdWJGb3JtO1xyXG4gICAgdGhpcy5fdmFsdWVDaGFuZ2VzLnNldFN1YkZvcm0oc3ViRm9ybSk7XHJcblxyXG4gICAgLy8gZm9yIHNvbWUgcmVhc29uIHJvb3QgaXMgbm90IHByb3Blcmx5IHNldCBmb3IgZm9ybSBhcnJheVxyXG4gICAgLy8gb24gdGhlIG90aGVyIGhhbmQgZm9ybSBhcnJheSBzaG91bGQgbmV2ZXIgYmUgcm9vdCBhbnl3YXkgc28gd2UgY2FuIGlnbm9yZSB0aHNpIGZvciBub3dcclxuICAgIC8vIGlmICh0aGlzLnJvb3QgPT09IHRoaXMpIHtcclxuICAgIC8vICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIHRyYW5zZm9ybSB0byBmb3JtIGdyb3VwIHNob3VsZCBuZXZlciByZXR1cm4gbnVsbCAvIHVuZGVmaW5lZCBidXQge30gaW5zdGVhZFxyXG4gICAgdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cCA9IChvYmo6IFRDb250cm9sIHwgbnVsbCwgZGVmYXVsdFZhbHVlczogUGFydGlhbDxURm9ybT4pID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3ViRm9ybVsndHJhbnNmb3JtVG9Gb3JtR3JvdXAnXShvYmosIGRlZmF1bHRWYWx1ZXMpIHx8ICh7fSBhcyBURm9ybSk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwID0gdGhpcy5zdWJGb3JtWyd0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gICAgdGhpcy5nZXREZWZhdWx0VmFsdWVzID0gdGhpcy5zdWJGb3JtWydnZXREZWZhdWx0VmFsdWVzJ10uYmluZCh0aGlzLnN1YkZvcm0pO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICBzdXBlci5zZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zOiBhbnkpIHtcclxuICAgIHN1cGVyLnBhdGNoVmFsdWUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgKCh0aGlzLnN1YkZvcm0uZm9ybUdyb3VwIGFzIHVua25vd24pIGFzIFN1YkZvcm1Hcm91cDxhbnk+KS51cGRhdGVWYWx1ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVZhbHVlKG9wdGlvbnM6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgICh0aGlzLnBhcmVudCBhcyBhbnkpLnVwZGF0ZVZhbHVlKG9wdGlvbnMpO1xyXG4gICAgLy90aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByZW1vdmVBdChpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVBdChpbmRleCk7XHJcbiAgICAoKHRoaXMuc3ViRm9ybS5mb3JtR3JvdXAgYXMgdW5rbm93bikgYXMgU3ViRm9ybUdyb3VwPGFueT4pLnVwZGF0ZVZhbHVlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==