import { __assign, __decorate, __extends, __metadata, __read } from "tslib";
import { Directive, Input } from '@angular/core';
import { FormArray, FormControl, } from '@angular/forms';
import { coerceToAsyncValidator, coerceToValidator } from './abstract-control-utils';
import { isNullOrUndefined, } from './ngx-sub-form-utils';
import { patchFormControl, SubFormGroup } from './sub-form-group';
var NgxSubFormComponent = /** @class */ (function () {
    // tslint:disable-next-line: directive-class-suffix
    function NgxSubFormComponent() {
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.emitNullOnDestroy = true;
        this.emitInitialValueOnInit = true;
    }
    Object.defineProperty(NgxSubFormComponent.prototype, "formControlNames", {
        get: function () {
            // see @note form-group-undefined for as syntax
            return this.mapControls(function (_, key) { return key; }, function () { return true; }, false);
        },
        enumerable: true,
        configurable: true
    });
    NgxSubFormComponent.prototype.ngOnChanges = function (changes) {
        if (changes['dataInput'] === undefined &&
            (changes['formGroup'] === undefined || (changes['formGroup'].firstChange && !changes['formGroup'].currentValue))) {
            return;
        }
        if (!this.formGroup) {
            throw new Error('The subForm input was not provided but is required.');
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
        var dataInputHasChanged = changes['dataInput'] !== undefined;
        this._initializeFormGroup(dataInputHasChanged);
    };
    NgxSubFormComponent.prototype.ngAfterContentChecked = function () {
        var _a;
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if ((_a = this.formGroup) === null || _a === void 0 ? void 0 : _a.cd) {
            // if this is the root form
            // OR if ist a sub form but the root form does not have a change detector
            // we need to actually run change detection vs just marking for check
            if (!this.formGroup.parent) {
                this.formGroup.cd.detectChanges();
            }
            else {
                this.formGroup.cd.markForCheck();
            }
        }
    };
    // is usually called by ngOnChanges
    // but if root form is used without input attributes ngOnChanges might not be called
    // hence if it wasn't called yet it is called from ngOnInit in root form
    NgxSubFormComponent.prototype._initializeFormGroup = function (dataInputHasChanged) {
        var _this = this;
        if (dataInputHasChanged === void 0) { dataInputHasChanged = false; }
        Object.keys(this.formGroup.controls).forEach(function (key) {
            _this.formGroup.removeControl(key);
        });
        var subForm = this.formGroup;
        var controls = this.getFormControls();
        for (var key in controls) {
            if (controls.hasOwnProperty(key)) {
                var control = controls[key];
                // we need to wire up the form controls with the sub form group
                // this allows us to transform the sub form value to ControlInterface
                // every time any of the form controls on the sub form change
                if (control instanceof FormControl) {
                    patchFormControl(subForm, control);
                }
                this.formGroup.addControl(key, control);
            }
        }
        // connect sub form group with current sub-form-component
        subForm.setSubForm(this);
        var options = this.getFormGroupControlOptions();
        var validators = [];
        var asyncValidators = [];
        // get validators that were passed into the sub form group on the parent
        if (subForm.parentValidatorOrOpts) {
            var validator = coerceToValidator(subForm.parentValidatorOrOpts);
            if (validator) {
                validators.push(validator);
            }
        }
        // get async validators that were passed into the sub form group on the parent
        if (subForm.parentAsyncValidator) {
            var validator = coerceToAsyncValidator(subForm.parentAsyncValidator);
            if (validator) {
                asyncValidators.push(validator);
            }
        }
        // handle AbstractControlOptions from getFormGroupControlOptions
        if (options) {
            if (options.updateOn) {
                // sadly there is no public metohd that lets us change the update strategy of an already created FormGroup
                this.formGroup._setUpdateStrategy(options.updateOn);
            }
            if (options.validators) {
                var validator = coerceToValidator(options.validators);
                if (validator) {
                    validators.push(validator);
                }
            }
            if (options.asyncValidators) {
                var validator = coerceToAsyncValidator(options.asyncValidators);
                if (validator) {
                    asyncValidators.push(validator);
                }
            }
        }
        // set validators / async validators on sub form group
        if (validators.length > 0) {
            this.formGroup.setValidators(validators);
        }
        if (asyncValidators.length > 0) {
            this.formGroup.setAsyncValidators(asyncValidators);
        }
        // if the form has default values, they should be applied straight away
        var defaultValues = this.getDefaultValues();
        // get default values for reset, if null fallback to undefined as there si a difference when calling reset
        var transformedValue = this.transformFromFormGroup(defaultValues) || undefined;
        var mergedValues;
        // not sure if this case is relevant as arrays are sub forms and would be handled by the other logic below
        var controlValue = (dataInputHasChanged ? this['dataInput'] : subForm.controlValue);
        if (transformedValue && controlValue) {
            mergedValues = __assign(__assign({}, transformedValue), { controlValue: controlValue });
        }
        else if (transformedValue) {
            mergedValues = transformedValue;
        }
        else {
            mergedValues = controlValue;
        }
        var formValue = this.transformToFormGroup(mergedValues, {});
        this.handleFormArrayControls(formValue);
        // self = false is critical here
        // this allows the parent form to re-evaluate its status after each of its sub form has completed intialization
        // we actually only need to call this on the deepest sub form in a tree (leaves)
        // but there is no way to identify if there are sub forms on the current form + that are also rendered
        // as only when sub forms are rendered the on changes method on the sub form is executed
        // TODO decide if we want to emit an event when input control value != control value after intialization
        // this happens for example when null is passed in but default values change the value of the inner form
        this.formGroup.reset(mergedValues, { onlySelf: false, emitEvent: false });
    };
    NgxSubFormComponent.prototype.mapControls = function (mapControl, filterControl, recursiveIfArray) {
        if (filterControl === void 0) { filterControl = function () { return true; }; }
        if (recursiveIfArray === void 0) { recursiveIfArray = true; }
        if (!this.formGroup) {
            return null;
        }
        var formControls = this.formGroup.controls;
        var controls = {};
        for (var key in formControls) {
            if (this.formGroup.controls.hasOwnProperty(key)) {
                var control = formControls[key];
                if (recursiveIfArray && control instanceof FormArray) {
                    var values = [];
                    for (var i = 0; i < control.length; i++) {
                        if (filterControl(control.at(i), key, true)) {
                            values.push(mapControl(control.at(i), key));
                        }
                    }
                    if (values.length > 0 && values.some(function (x) { return !isNullOrUndefined(x); })) {
                        controls[key] = values;
                    }
                }
                else if (control && filterControl(control, key, false)) {
                    controls[key] = mapControl(control, key);
                }
            }
        }
        return controls;
    };
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    NgxSubFormComponent.prototype.getFormGroupControlOptions = function () {
        return {};
    };
    // when getDefaultValues is defined, you do not need to specify the default values
    // in your form (the ones defined within the `getFormControls` method)
    NgxSubFormComponent.prototype.getDefaultValues = function () {
        return {};
    };
    NgxSubFormComponent.prototype.handleFormArrayControls = function (obj) {
        var _this = this;
        // TODO check if this can still happen, it appeared during development. might already be fixed
        if (!this.formGroup) {
            return;
        }
        Object.entries(obj).forEach(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            if (_this.formGroup.get(key) instanceof FormArray && Array.isArray(value)) {
                var formArray = _this.formGroup.get(key);
                // instead of creating a new array every time and push a new FormControl
                // we just remove or add what is necessary so that:
                // - it is as efficient as possible and do not create unnecessary FormControl every time
                // - validators are not destroyed/created again and eventually fire again for no reason
                while (formArray.length > value.length) {
                    formArray.removeAt(formArray.length - 1);
                }
                for (var i = formArray.length; i < value.length; i++) {
                    if (_this.formIsFormWithArrayControls()) {
                        formArray.insert(i, _this.createFormArrayControl(key, value[i]));
                    }
                    else {
                        var control = new FormControl(value[i]);
                        patchFormControl(_this.formGroup, control);
                        formArray.insert(i, control);
                    }
                }
            }
        });
    };
    NgxSubFormComponent.prototype.formIsFormWithArrayControls = function () {
        return typeof this.createFormArrayControl === 'function';
    };
    // when customizing the emission rate of your sub form component, remember not to **mutate** the stream
    // it is safe to throttle, debounce, delay, etc but using skip, first, last or mutating data inside
    // the stream will cause issues!
    NgxSubFormComponent.prototype.handleEmissionRate = function () {
        return function (obs$) { return obs$; };
    };
    // that method can be overridden if the
    // shape of the form needs to be modified
    NgxSubFormComponent.prototype.transformToFormGroup = function (obj, defaultValues) {
        // formGroup values can't be null
        return (obj || defaultValues || {});
    };
    // that method can be overridden if the
    // shape of the form needs to be modified
    NgxSubFormComponent.prototype.transformFromFormGroup = function (formValue) {
        return formValue;
    };
    __decorate([
        Input('subForm'),
        __metadata("design:type", Object)
    ], NgxSubFormComponent.prototype, "formGroup", void 0);
    NgxSubFormComponent = __decorate([
        Directive()
        // tslint:disable-next-line: directive-class-suffix
    ], NgxSubFormComponent);
    return NgxSubFormComponent;
}());
export { NgxSubFormComponent };
var NgxSubFormRemapComponent = /** @class */ (function (_super) {
    __extends(NgxSubFormRemapComponent, _super);
    // tslint:disable-next-line: directive-class-suffix
    function NgxSubFormRemapComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NgxSubFormRemapComponent = __decorate([
        Directive()
        // tslint:disable-next-line: directive-class-suffix
    ], NgxSubFormRemapComponent);
    return NgxSubFormRemapComponent;
}(NgxSubFormComponent));
export { NgxSubFormRemapComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFzUjFDLENBQUM7SUFqUkMsc0JBQVcsaURBQWdCO2FBQTNCO1lBQ0UsK0NBQStDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsVUFBQyxDQUFDLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxFQUFILENBQUcsRUFDZixjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksRUFDVixLQUFLLENBQzBCLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRCx5Q0FBVyxHQUFYLFVBQVksT0FBc0I7UUFDaEMsSUFDRSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUztZQUNsQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcs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bUJBQW1CLEdBUzFHO1NBVHFCLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyQ29udGVudENoZWNrZWQsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUFycmF5LFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIFZhbGlkYXRvckZuLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlVG9Bc3luY1ZhbGlkYXRvciwgY29lcmNlVG9WYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0LWNvbnRyb2wtdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIEFycmF5UHJvcGVydHlLZXksXHJcbiAgQ29udHJvbE1hcCxcclxuICBDb250cm9scyxcclxuICBDb250cm9sc05hbWVzLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IHBhdGNoRm9ybUNvbnRyb2wsIFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKGN0cmw6IEFic3RyYWN0Q29udHJvbCwga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlKSA9PiBNYXBWYWx1ZTtcclxudHlwZSBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbiAgaXNDdHJsV2l0aGluRm9ybUFycmF5OiBib29sZWFuLFxyXG4pID0+IGJvb2xlYW47XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRDaGVja2VkIHtcclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG5cclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWlucHV0LXJlbmFtZVxyXG4gIEBJbnB1dCgnc3ViRm9ybScpIGZvcm1Hcm91cCE6IFR5cGVkU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGNoYW5nZXNbJ2RhdGFJbnB1dCddID09PSB1bmRlZmluZWQgJiZcclxuICAgICAgKGNoYW5nZXNbJ2Zvcm1Hcm91cCddID09PSB1bmRlZmluZWQgfHwgKGNoYW5nZXNbJ2Zvcm1Hcm91cCddLmZpcnN0Q2hhbmdlICYmICFjaGFuZ2VzWydmb3JtR3JvdXAnXS5jdXJyZW50VmFsdWUpKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgd2FzIG5vdCBwcm92aWRlZCBidXQgaXMgcmVxdWlyZWQuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEodGhpcy5mb3JtR3JvdXAgaW5zdGFuY2VvZiBTdWJGb3JtR3JvdXApKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN1YkZvcm0gaW5wdXQgbmVlZHMgdG8gYmUgb2YgdHlwZSBTdWJGb3JtR3JvdXAuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YUlucHV0SGFzQ2hhbmdlZCA9IGNoYW5nZXNbJ2RhdGFJbnB1dCddICE9PSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLl9pbml0aWFsaXplRm9ybUdyb3VwKGRhdGFJbnB1dEhhc0NoYW5nZWQpO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyB0aGlzIHJ1bnMgdG9vIG9mdGVuLCBmaW5kIG91dCBvZiB0aGlzIGNhbiBiZSB0cmlnZ2VyZWQgZGlmZmVyZW50bHlcclxuICAgIC8vIGNoZWNraW5nIGlmIHRoZSBmb3JtIGdyb3VwIGhhcyBhIGNoYW5nZSBkZXRlY3RvciAocm9vdCBmb3JtcyBtaWdodCBub3QpXHJcbiAgICBpZiAodGhpcy5mb3JtR3JvdXA/LmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gaXMgdXN1YWxseSBjYWxsZWQgYnkgbmdPbkNoYW5nZXNcclxuICAvLyBidXQgaWYgcm9vdCBmb3JtIGlzIHVzZWQgd2l0aG91dCBpbnB1dCBhdHRyaWJ1dGVzIG5nT25DaGFuZ2VzIG1pZ2h0IG5vdCBiZSBjYWxsZWRcclxuICAvLyBoZW5jZSBpZiBpdCB3YXNuJ3QgY2FsbGVkIHlldCBpdCBpcyBjYWxsZWQgZnJvbSBuZ09uSW5pdCBpbiByb290IGZvcm1cclxuICBwcm90ZWN0ZWQgX2luaXRpYWxpemVGb3JtR3JvdXAoZGF0YUlucHV0SGFzQ2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1Hcm91cC5jb250cm9scykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZW1vdmVDb250cm9sKGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJGb3JtID0gdGhpcy5mb3JtR3JvdXA7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udHJvbHMpIHtcclxuICAgICAgaWYgKGNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gY29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3aXJlIHVwIHRoZSBmb3JtIGNvbnRyb2xzIHdpdGggdGhlIHN1YiBmb3JtIGdyb3VwXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNmb3JtIHRoZSBzdWIgZm9ybSB2YWx1ZSB0byBDb250cm9sSW50ZXJmYWNlXHJcbiAgICAgICAgLy8gZXZlcnkgdGltZSBhbnkgb2YgdGhlIGZvcm0gY29udHJvbHMgb24gdGhlIHN1YiBmb3JtIGNoYW5nZVxyXG4gICAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgRm9ybUNvbnRyb2wpIHtcclxuICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2woc3ViRm9ybSwgY29udHJvbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5hZGRDb250cm9sKGtleSwgY29udHJvbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25uZWN0IHN1YiBmb3JtIGdyb3VwIHdpdGggY3VycmVudCBzdWItZm9ybS1jb21wb25lbnRcclxuICAgIHN1YkZvcm0uc2V0U3ViRm9ybSh0aGlzKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdG9yczogVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG4gICAgY29uc3QgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZuW10gPSBbXTtcclxuXHJcbiAgICAvLyBnZXQgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cykge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cyk7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBhc3luYyB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgQWJzdHJhY3RDb250cm9sT3B0aW9ucyBmcm9tIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbikge1xyXG4gICAgICAgIC8vIHNhZGx5IHRoZXJlIGlzIG5vIHB1YmxpYyBtZXRvaGQgdGhhdCBsZXRzIHVzIGNoYW5nZSB0aGUgdXBkYXRlIHN0cmF0ZWd5IG9mIGFuIGFscmVhZHkgY3JlYXRlZCBGb3JtR3JvdXBcclxuICAgICAgICAodGhpcy5mb3JtR3JvdXAgYXMgYW55KS5fc2V0VXBkYXRlU3RyYXRlZ3kob3B0aW9ucy51cGRhdGVPbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihvcHRpb25zLnZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihvcHRpb25zLmFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdmFsaWRhdG9ycyAvIGFzeW5jIHZhbGlkYXRvcnMgb24gc3ViIGZvcm0gZ3JvdXBcclxuICAgIGlmICh2YWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0VmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcclxuICAgIH1cclxuICAgIGlmIChhc3luY1ZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGUgZm9ybSBoYXMgZGVmYXVsdCB2YWx1ZXMsIHRoZXkgc2hvdWxkIGJlIGFwcGxpZWQgc3RyYWlnaHQgYXdheVxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKTtcclxuXHJcbiAgICAvLyBnZXQgZGVmYXVsdCB2YWx1ZXMgZm9yIHJlc2V0LCBpZiBudWxsIGZhbGxiYWNrIHRvIHVuZGVmaW5lZCBhcyB0aGVyZSBzaSBhIGRpZmZlcmVuY2Ugd2hlbiBjYWxsaW5nIHJlc2V0XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMgYXMgRm9ybUludGVyZmFjZSkgfHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIGxldCBtZXJnZWRWYWx1ZXM6IENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICAvLyBub3Qgc3VyZSBpZiB0aGlzIGNhc2UgaXMgcmVsZXZhbnQgYXMgYXJyYXlzIGFyZSBzdWIgZm9ybXMgYW5kIHdvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIG90aGVyIGxvZ2ljIGJlbG93XHJcblxyXG4gICAgY29uc3QgY29udHJvbFZhbHVlID0gKGRhdGFJbnB1dEhhc0NoYW5nZWQgPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG5cclxuICAgIGlmICh0cmFuc2Zvcm1lZFZhbHVlICYmIGNvbnRyb2xWYWx1ZSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSB7IC4uLnRyYW5zZm9ybWVkVmFsdWUsIGNvbnRyb2xWYWx1ZSB9O1xyXG4gICAgfSBlbHNlIGlmICh0cmFuc2Zvcm1lZFZhbHVlKSB7XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHRyYW5zZm9ybWVkVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSBjb250cm9sVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlID0gdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChtZXJnZWRWYWx1ZXMsIHt9KTtcclxuICAgIHRoaXMuaGFuZGxlRm9ybUFycmF5Q29udHJvbHMoZm9ybVZhbHVlKTtcclxuXHJcbiAgICAvLyBzZWxmID0gZmFsc2UgaXMgY3JpdGljYWwgaGVyZVxyXG4gICAgLy8gdGhpcyBhbGxvd3MgdGhlIHBhcmVudCBmb3JtIHRvIHJlLWV2YWx1YXRlIGl0cyBzdGF0dXMgYWZ0ZXIgZWFjaCBvZiBpdHMgc3ViIGZvcm0gaGFzIGNvbXBsZXRlZCBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB3ZSBhY3R1YWxseSBvbmx5IG5lZWQgdG8gY2FsbCB0aGlzIG9uIHRoZSBkZWVwZXN0IHN1YiBmb3JtIGluIGEgdHJlZSAobGVhdmVzKVxyXG4gICAgLy8gYnV0IHRoZXJlIGlzIG5vIHdheSB0byBpZGVudGlmeSBpZiB0aGVyZSBhcmUgc3ViIGZvcm1zIG9uIHRoZSBjdXJyZW50IGZvcm0gKyB0aGF0IGFyZSBhbHNvIHJlbmRlcmVkXHJcbiAgICAvLyBhcyBvbmx5IHdoZW4gc3ViIGZvcm1zIGFyZSByZW5kZXJlZCB0aGUgb24gY2hhbmdlcyBtZXRob2Qgb24gdGhlIHN1YiBmb3JtIGlzIGV4ZWN1dGVkXHJcblxyXG4gICAgLy8gVE9ETyBkZWNpZGUgaWYgd2Ugd2FudCB0byBlbWl0IGFuIGV2ZW50IHdoZW4gaW5wdXQgY29udHJvbCB2YWx1ZSAhPSBjb250cm9sIHZhbHVlIGFmdGVyIGludGlhbGl6YXRpb25cclxuICAgIC8vIHRoaXMgaGFwcGVucyBmb3IgZXhhbXBsZSB3aGVuIG51bGwgaXMgcGFzc2VkIGluIGJ1dCBkZWZhdWx0IHZhbHVlcyBjaGFuZ2UgdGhlIHZhbHVlIG9mIHRoZSBpbm5lciBmb3JtXHJcbiAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChtZXJnZWRWYWx1ZXMsIHsgb25seVNlbGY6IGZhbHNlLCBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVGb3JtQXJyYXlDb250cm9scyhvYmo6IGFueSkge1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGNhbiBzdGlsbCBoYXBwZW4sIGl0IGFwcGVhcmVkIGR1cmluZyBkZXZlbG9wbWVudC4gbWlnaHQgYWxyZWFkeSBiZSBmaXhlZFxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGluc3RhbmNlb2YgRm9ybUFycmF5ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3QgZm9ybUFycmF5OiBGb3JtQXJyYXkgPSB0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBhcyBGb3JtQXJyYXk7XHJcblxyXG4gICAgICAgIC8vIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgYXJyYXkgZXZlcnkgdGltZSBhbmQgcHVzaCBhIG5ldyBGb3JtQ29udHJvbFxyXG4gICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlIG9yIGFkZCB3aGF0IGlzIG5lY2Vzc2FyeSBzbyB0aGF0OlxyXG4gICAgICAgIC8vIC0gaXQgaXMgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlIGFuZCBkbyBub3QgY3JlYXRlIHVubmVjZXNzYXJ5IEZvcm1Db250cm9sIGV2ZXJ5IHRpbWVcclxuICAgICAgICAvLyAtIHZhbGlkYXRvcnMgYXJlIG5vdCBkZXN0cm95ZWQvY3JlYXRlZCBhZ2FpbiBhbmQgZXZlbnR1YWxseSBmaXJlIGFnYWluIGZvciBubyByZWFzb25cclxuICAgICAgICB3aGlsZSAoZm9ybUFycmF5Lmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGZvcm1BcnJheS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmb3JtQXJyYXkubGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICh0aGlzLmZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpKSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgdGhpcy5jcmVhdGVGb3JtQXJyYXlDb250cm9sKGtleSBhcyBBcnJheVByb3BlcnR5S2V5PEZvcm1JbnRlcmZhY2U+LCB2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSk7XHJcbiAgICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2wodGhpcy5mb3JtR3JvdXAsIGNvbnRyb2wpO1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIGNvbnRyb2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGN1c3RvbWl6aW5nIHRoZSBlbWlzc2lvbiByYXRlIG9mIHlvdXIgc3ViIGZvcm0gY29tcG9uZW50LCByZW1lbWJlciBub3QgdG8gKiptdXRhdGUqKiB0aGUgc3RyZWFtXHJcbiAgLy8gaXQgaXMgc2FmZSB0byB0aHJvdHRsZSwgZGVib3VuY2UsIGRlbGF5LCBldGMgYnV0IHVzaW5nIHNraXAsIGZpcnN0LCBsYXN0IG9yIG11dGF0aW5nIGRhdGEgaW5zaWRlXHJcbiAgLy8gdGhlIHN0cmVhbSB3aWxsIGNhdXNlIGlzc3VlcyFcclxuICBwdWJsaWMgaGFuZGxlRW1pc3Npb25SYXRlKCk6IChvYnMkOiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPikgPT4gT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIC8vIGZvcm1Hcm91cCB2YWx1ZXMgY2FuJ3QgYmUgbnVsbFxyXG4gICAgcmV0dXJuIChvYmogfHwgZGVmYXVsdFZhbHVlcyB8fCB7fSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxufVxyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+IGV4dGVuZHMgTmd4U3ViRm9ybUNvbXBvbmVudDxcclxuICBDb250cm9sSW50ZXJmYWNlLFxyXG4gIEZvcm1JbnRlcmZhY2VcclxuPiB7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsO1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsO1xyXG59XHJcbiJdfQ==