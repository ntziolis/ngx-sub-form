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
        // since this is the initial setting of form values do NOT emit an event
        var mergedValues;
        if (Array.isArray(transformedValue)) {
            mergedValues = subForm.controlValue;
        }
        else {
            var controlValue = (dataInputHasChanged ? this['dataInput'] : subForm.controlValue) || {};
            mergedValues = __assign(__assign({}, transformedValue), controlValue);
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
        // TODO check if this can still happen, it appreaded during development. might alerady be fixed
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
        return obj;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFpUjFDLENBQUM7SUE1UUMsc0JBQVcsaURBQWdCO2FBQTNCO1lBQ0UsK0NBQStDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsVUFBQyxDQUFDLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxFQUFILENBQUcsRUFDZixjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksRUFDVixLQUFLLENBQzBCLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRCx5Q0FBVyxHQUFYLFVBQVksT0FBc0I7UUFDaEMsSUFDRSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUztZQUNsQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcs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ZW50Q2hlY2tlZCwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yLCBjb2VyY2VUb1ZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtY29udHJvbC11dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgQ29udHJvbHNUeXBlLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgcGF0Y2hGb3JtQ29udHJvbCwgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoY3RybDogQWJzdHJhY3RDb250cm9sLCBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UpID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyQ29udGVudENoZWNrZWQge1xyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8taW5wdXQtcmVuYW1lXHJcbiAgQElucHV0KCdzdWJGb3JtJykgZm9ybUdyb3VwITogVHlwZWRTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IHRydWU7XHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSB0cnVlO1xyXG5cclxuICAvLyBjYW4ndCBkZWZpbmUgdGhlbSBkaXJlY3RseVxyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRGb3JtQ29udHJvbHMoKTogQ29udHJvbHM8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUNvbnRyb2xOYW1lcygpOiBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3IgYXMgc3ludGF4XHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhcclxuICAgICAgKF8sIGtleSkgPT4ga2V5LFxyXG4gICAgICAoKSA9PiB0cnVlLFxyXG4gICAgICBmYWxzZSxcclxuICAgICkgYXMgQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcclxuICAgIGlmIChcclxuICAgICAgY2hhbmdlc1snZGF0YUlucHV0J10gPT09IHVuZGVmaW5lZCAmJlxyXG4gICAgICAoY2hhbmdlc1snZm9ybUdyb3VwJ10gPT09IHVuZGVmaW5lZCB8fCAoY2hhbmdlc1snZm9ybUdyb3VwJ10uZmlyc3RDaGFuZ2UgJiYgIWNoYW5nZXNbJ2Zvcm1Hcm91cCddLmN1cnJlbnRWYWx1ZSkpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCB3YXMgbm90IHByb3ZpZGVkIGJ1dCBpcyByZXF1aXJlZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISh0aGlzLmZvcm1Hcm91cCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCBuZWVkcyB0byBiZSBvZiB0eXBlIFN1YkZvcm1Hcm91cC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhSW5wdXRIYXNDaGFuZ2VkID0gY2hhbmdlc1snZGF0YUlucHV0J10gIT09IHVuZGVmaW5lZFxyXG4gICAgdGhpcy5faW5pdGlhbGl6ZUZvcm1Hcm91cChkYXRhSW5wdXRIYXNDaGFuZ2VkKTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpOiB2b2lkIHtcclxuICAgIC8vIFRPRE8gdGhpcyBydW5zIHRvbyBvZnRlbiwgZmluZCBvdXQgb2YgdGhpcyBjYW4gYmUgdHJpZ2dlcmVkIGRpZmZlcmVudGx5XHJcbiAgICAvLyBjaGVja2luZyBpZiB0aGUgZm9ybSBncm91cCBoYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgKHJvb3QgZm9ybXMgbWlnaHQgbm90KVxyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwPy5jZCkge1xyXG4gICAgICAvLyBpZiB0aGlzIGlzIHRoZSByb290IGZvcm1cclxuICAgICAgLy8gT1IgaWYgaXN0IGEgc3ViIGZvcm0gYnV0IHRoZSByb290IGZvcm0gZG9lcyBub3QgaGF2ZSBhIGNoYW5nZSBkZXRlY3RvclxyXG4gICAgICAvLyB3ZSBuZWVkIHRvIGFjdHVhbGx5IHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIHZzIGp1c3QgbWFya2luZyBmb3IgY2hlY2tcclxuICAgICAgaWYgKCF0aGlzLmZvcm1Hcm91cC5wYXJlbnQpIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuY2QubWFya0ZvckNoZWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIGlzIHVzdWFsbHkgY2FsbGVkIGJ5IG5nT25DaGFuZ2VzXHJcbiAgLy8gYnV0IGlmIHJvb3QgZm9ybSBpcyB1c2VkIHdpdGhvdXQgaW5wdXQgYXR0cmlidXRlcyBuZ09uQ2hhbmdlcyBtaWdodCBub3QgYmUgY2FsbGVkXHJcbiAgLy8gaGVuY2UgaWYgaXQgd2Fzbid0IGNhbGxlZCB5ZXQgaXQgaXMgY2FsbGVkIGZyb20gbmdPbkluaXQgaW4gcm9vdCBmb3JtXHJcbiAgcHJvdGVjdGVkIF9pbml0aWFsaXplRm9ybUdyb3VwKGRhdGFJbnB1dEhhc0NoYW5nZWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gICAgT2JqZWN0LmtleXModGhpcy5mb3JtR3JvdXAuY29udHJvbHMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAucmVtb3ZlQ29udHJvbChrZXkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3ViRm9ybSA9IHRoaXMuZm9ybUdyb3VwO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5nZXRGb3JtQ29udHJvbHMoKTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbnRyb2xzKSB7XHJcbiAgICAgIGlmIChjb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gd2lyZSB1cCB0aGUgZm9ybSBjb250cm9scyB3aXRoIHRoZSBzdWIgZm9ybSBncm91cFxyXG4gICAgICAgIC8vIHRoaXMgYWxsb3dzIHVzIHRvIHRyYW5zZm9ybSB0aGUgc3ViIGZvcm0gdmFsdWUgdG8gQ29udHJvbEludGVyZmFjZVxyXG4gICAgICAgIC8vIGV2ZXJ5IHRpbWUgYW55IG9mIHRoZSBmb3JtIGNvbnRyb2xzIG9uIHRoZSBzdWIgZm9ybSBjaGFuZ2VcclxuICAgICAgICBpZiAoY29udHJvbCBpbnN0YW5jZW9mIEZvcm1Db250cm9sKSB7XHJcbiAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHN1YkZvcm0sIGNvbnRyb2wpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuYWRkQ29udHJvbChrZXksIGNvbnRyb2wpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29ubmVjdCBzdWIgZm9ybSBncm91cCB3aXRoIGN1cnJlbnQgc3ViLWZvcm0tY29tcG9uZW50XHJcbiAgICBzdWJGb3JtLnNldFN1YkZvcm0odGhpcyk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKSBhcyBBYnN0cmFjdENvbnRyb2xPcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHZhbGlkYXRvcnM6IFZhbGlkYXRvckZuW10gPSBbXTtcclxuICAgIGNvbnN0IGFzeW5jVmFsaWRhdG9yczogQXN5bmNWYWxpZGF0b3JGbltdID0gW107XHJcblxyXG4gICAgLy8gZ2V0IHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRWYWxpZGF0b3JPck9wdHMpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBnZXQgYXN5bmMgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Ioc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcik7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGFuZGxlIEFic3RyYWN0Q29udHJvbE9wdGlvbnMgZnJvbSBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9uc1xyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgaWYgKG9wdGlvbnMudXBkYXRlT24pIHtcclxuICAgICAgICAvLyBzYWRseSB0aGVyZSBpcyBubyBwdWJsaWMgbWV0b2hkIHRoYXQgbGV0cyB1cyBjaGFuZ2UgdGhlIHVwZGF0ZSBzdHJhdGVneSBvZiBhbiBhbHJlYWR5IGNyZWF0ZWQgRm9ybUdyb3VwXHJcbiAgICAgICAgKHRoaXMuZm9ybUdyb3VwIGFzIGFueSkuX3NldFVwZGF0ZVN0cmF0ZWd5KG9wdGlvbnMudXBkYXRlT24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9WYWxpZGF0b3Iob3B0aW9ucy52YWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLmFzeW5jVmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3Iob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHZhbGlkYXRvcnMgLyBhc3luYyB2YWxpZGF0b3JzIG9uIHN1YiBmb3JtIGdyb3VwXHJcbiAgICBpZiAodmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldFZhbGlkYXRvcnModmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXN5bmNWYWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0QXN5bmNWYWxpZGF0b3JzKGFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgdGhlIGZvcm0gaGFzIGRlZmF1bHQgdmFsdWVzLCB0aGV5IHNob3VsZCBiZSBhcHBsaWVkIHN0cmFpZ2h0IGF3YXlcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsID0gdGhpcy5nZXREZWZhdWx0VmFsdWVzKCk7XHJcblxyXG4gICAgLy8gZ2V0IGRlZmF1bHQgdmFsdWVzIGZvciByZXNldCwgaWYgbnVsbCBmYWxsYmFjayB0byB1bmRlZmluZWQgYXMgdGhlcmUgc2kgYSBkaWZmZXJlbmNlIHdoZW4gY2FsbGluZyByZXNldFxyXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZSA9IHRoaXMudHJhbnNmb3JtRnJvbUZvcm1Hcm91cChkZWZhdWx0VmFsdWVzIGFzIEZvcm1JbnRlcmZhY2UpIHx8IHVuZGVmaW5lZDtcclxuICAgIC8vIHNpbmNlIHRoaXMgaXMgdGhlIGluaXRpYWwgc2V0dGluZyBvZiBmb3JtIHZhbHVlcyBkbyBOT1QgZW1pdCBhbiBldmVudFxyXG5cclxuICAgIGxldCBtZXJnZWRWYWx1ZXM6IENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmFuc2Zvcm1lZFZhbHVlKSkge1xyXG4gICAgICBtZXJnZWRWYWx1ZXMgPSBzdWJGb3JtLmNvbnRyb2xWYWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IChkYXRhSW5wdXRIYXNDaGFuZ2VkID8gKHRoaXMgYXMgYW55KVsnZGF0YUlucHV0J10gOiBzdWJGb3JtLmNvbnRyb2xWYWx1ZSkgfHwge307XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHsgLi4udHJhbnNmb3JtZWRWYWx1ZSwgLi4uY29udHJvbFZhbHVlIH0gYXMgQ29udHJvbEludGVyZmFjZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKG1lcmdlZFZhbHVlcywge30pO1xyXG4gICAgdGhpcy5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIC8vIHNlbGYgPSBmYWxzZSBpcyBjcml0aWNhbCBoZXJlXHJcbiAgICAvLyB0aGlzIGFsbG93cyB0aGUgcGFyZW50IGZvcm0gdG8gcmUtZXZhbHVhdGUgaXRzIHN0YXR1cyBhZnRlciBlYWNoIG9mIGl0cyBzdWIgZm9ybSBoYXMgY29tcGxldGVkIGludGlhbGl6YXRpb25cclxuICAgIC8vIHdlIGFjdHVhbGx5IG9ubHkgbmVlZCB0byBjYWxsIHRoaXMgb24gdGhlIGRlZXBlc3Qgc3ViIGZvcm0gaW4gYSB0cmVlIChsZWF2ZXMpXHJcbiAgICAvLyBidXQgdGhlcmUgaXMgbm8gd2F5IHRvIGlkZW50aWZ5IGlmIHRoZXJlIGFyZSBzdWIgZm9ybXMgb24gdGhlIGN1cnJlbnQgZm9ybSArIHRoYXQgYXJlIGFsc28gcmVuZGVyZWRcclxuICAgIC8vIGFzIG9ubHkgd2hlbiBzdWIgZm9ybXMgYXJlIHJlbmRlcmVkIHRoZSBvbiBjaGFuZ2VzIG1ldGhvZCBvbiB0aGUgc3ViIGZvcm0gaXMgZXhlY3V0ZWRcclxuXHJcbiAgICAvLyBUT0RPIGRlY2lkZSBpZiB3ZSB3YW50IHRvIGVtaXQgYW4gZXZlbnQgd2hlbiBpbnB1dCBjb250cm9sIHZhbHVlICE9IGNvbnRyb2wgdmFsdWUgYWZ0ZXIgaW50aWFsaXphdGlvblxyXG4gICAgLy8gdGhpcyBoYXBwZW5zIGZvciBleGFtcGxlIHdoZW4gbnVsbCBpcyBwYXNzZWQgaW4gYnV0IGRlZmF1bHQgdmFsdWVzIGNoYW5nZSB0aGUgdmFsdWUgb2YgdGhlIGlubmVyIGZvcm1cclxuICAgIHRoaXMuZm9ybUdyb3VwLnJlc2V0KG1lcmdlZFZhbHVlcywgeyBvbmx5U2VsZjogZmFsc2UsIGVtaXRFdmVudDogZmFsc2UgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4sXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICk6IENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKCkgPT4gdHJ1ZSxcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4gPSB0cnVlLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGwge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtQ29udHJvbHM6IENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPiA9IHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBmb3JtQ29udHJvbHMpIHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybUNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIGlmIChyZWN1cnNpdmVJZkFycmF5ICYmIGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQXJyYXkpIHtcclxuICAgICAgICAgIGNvbnN0IHZhbHVlczogTWFwVmFsdWVbXSA9IFtdO1xyXG5cclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udHJvbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXksIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWVzLnB1c2gobWFwQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCAmJiB2YWx1ZXMuc29tZSh4ID0+ICFpc051bGxPclVuZGVmaW5lZCh4KSkpIHtcclxuICAgICAgICAgICAgY29udHJvbHNba2V5XSA9IHZhbHVlcztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRyb2wgJiYgZmlsdGVyQ29udHJvbChjb250cm9sLCBrZXksIGZhbHNlKSkge1xyXG4gICAgICAgICAgY29udHJvbHNba2V5XSA9IG1hcENvbnRyb2woY29udHJvbCwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29udHJvbHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRlbmQgdGhpcyBtZXRob2QgdG8gcHJvdmlkZSBjdXN0b20gbG9jYWwgRm9ybUdyb3VwIGxldmVsIHZhbGlkYXRpb25cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKTogRm9ybUdyb3VwT3B0aW9uczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGdldERlZmF1bHRWYWx1ZXMgaXMgZGVmaW5lZCwgeW91IGRvIG5vdCBuZWVkIHRvIHNwZWNpZnkgdGhlIGRlZmF1bHQgdmFsdWVzXHJcbiAgLy8gaW4geW91ciBmb3JtICh0aGUgb25lcyBkZWZpbmVkIHdpdGhpbiB0aGUgYGdldEZvcm1Db250cm9sc2AgbWV0aG9kKVxyXG4gIHByb3RlY3RlZCBnZXREZWZhdWx0VmFsdWVzKCk6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKG9iajogYW55KSB7XHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHRoaXMgY2FuIHN0aWxsIGhhcHBlbiwgaXQgYXBwcmVhZGVkIGR1cmluZyBkZXZlbG9wbWVudC4gbWlnaHQgYWxlcmFkeSBiZSBmaXhlZFxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGluc3RhbmNlb2YgRm9ybUFycmF5ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3QgZm9ybUFycmF5OiBGb3JtQXJyYXkgPSB0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBhcyBGb3JtQXJyYXk7XHJcblxyXG4gICAgICAgIC8vIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgYXJyYXkgZXZlcnkgdGltZSBhbmQgcHVzaCBhIG5ldyBGb3JtQ29udHJvbFxyXG4gICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlIG9yIGFkZCB3aGF0IGlzIG5lY2Vzc2FyeSBzbyB0aGF0OlxyXG4gICAgICAgIC8vIC0gaXQgaXMgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlIGFuZCBkbyBub3QgY3JlYXRlIHVubmVjZXNzYXJ5IEZvcm1Db250cm9sIGV2ZXJ5IHRpbWVcclxuICAgICAgICAvLyAtIHZhbGlkYXRvcnMgYXJlIG5vdCBkZXN0cm95ZWQvY3JlYXRlZCBhZ2FpbiBhbmQgZXZlbnR1YWxseSBmaXJlIGFnYWluIGZvciBubyByZWFzb25cclxuICAgICAgICB3aGlsZSAoZm9ybUFycmF5Lmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGZvcm1BcnJheS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmb3JtQXJyYXkubGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICh0aGlzLmZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpKSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgdGhpcy5jcmVhdGVGb3JtQXJyYXlDb250cm9sKGtleSBhcyBBcnJheVByb3BlcnR5S2V5PEZvcm1JbnRlcmZhY2U+LCB2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSk7XHJcbiAgICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2wodGhpcy5mb3JtR3JvdXAsIGNvbnRyb2wpO1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIGNvbnRyb2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGN1c3RvbWl6aW5nIHRoZSBlbWlzc2lvbiByYXRlIG9mIHlvdXIgc3ViIGZvcm0gY29tcG9uZW50LCByZW1lbWJlciBub3QgdG8gKiptdXRhdGUqKiB0aGUgc3RyZWFtXHJcbiAgLy8gaXQgaXMgc2FmZSB0byB0aHJvdHRsZSwgZGVib3VuY2UsIGRlbGF5LCBldGMgYnV0IHVzaW5nIHNraXAsIGZpcnN0LCBsYXN0IG9yIG11dGF0aW5nIGRhdGEgaW5zaWRlXHJcbiAgLy8gdGhlIHN0cmVhbSB3aWxsIGNhdXNlIGlzc3VlcyFcclxuICBwdWJsaWMgaGFuZGxlRW1pc3Npb25SYXRlKCk6IChvYnMkOiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPikgPT4gT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIGFueSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxufVxyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+IGV4dGVuZHMgTmd4U3ViRm9ybUNvbXBvbmVudDxcclxuICBDb250cm9sSW50ZXJmYWNlLFxyXG4gIEZvcm1JbnRlcmZhY2VcclxuPiB7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsO1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsO1xyXG59XHJcbiJdfQ==