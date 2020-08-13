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
        var _this = this;
        if (changes['dataInput'] === undefined && changes['formGroup'] === undefined) {
            return;
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
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
            var controlValue = (changes['dataInput'] ? this['dataInput'] : subForm.controlValue) || {};
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
    NgxSubFormComponent.prototype.ngAfterContentChecked = function () {
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if (this.formGroup.cd) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFrUTFDLENBQUM7SUE3UEMsc0JBQVcsaURBQWdCO2FBQTNCO1lBQ0UsK0NBQStDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsVUFBQyxDQUFDLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxFQUFILENBQUcsRUFDZixjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksRUFDVixLQUFLLENBQzBCLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRCx5Q0FBVyxHQUFYLFVBQVksT0FBc0I7UUFBbEMsaUJBZ0hDO1FBL0dDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVFLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLFlB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O0lBQ3ZDLHlDQUF5QztJQUMvQixrREFBb0IsR0FBOUIsVUFDRSxHQUE0QixFQUM1QixhQUE0QztRQUU1QyxPQUFRLEdBQTRCLENBQUM7SUFDdkMsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx5Q0FBeUM7SUFDL0Isb0RBQXNCLEdBQWhDLFVBQWlDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBcUMsQ0FBQztJQUNoRCxDQUFDO0lBcFFpQjtRQUFqQixLQUFLLENBQUMsU0FBUyxDQUFDOzswREFBZ0U7SUFQN0QsbUJBQW1CO1FBRnhDLFNBQVMsRUFBRTtRQUNaLG1EQUFtRDtPQUM3QixtQkFBbUIsQ0E0UXhDO0lBQUQsMEJBQUM7Q0FBQSxBQTVRRCxJQTRRQztTQTVRcUIsbUJBQW1CO0FBZ1J6QztJQUF3Riw0Q0FHdkY7SUFKRCxtREFBbUQ7SUFDbkQ7O0lBU0EsQ0FBQztJQVRxQix3QkFBd0I7UUFGN0MsU0FBUyxFQUFFO1FBQ1osbURBQW1EO09BQzdCLHdCQUF3QixDQVM3QztJQUFELCtCQUFDO0NBQUEsQUFURCxDQUF3RixtQkFBbUIsR0FTMUc7U0FUcUIsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJDb250ZW50Q2hlY2tlZCwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yLCBjb2VyY2VUb1ZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtY29udHJvbC11dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgQ29udHJvbHNUeXBlLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgcGF0Y2hGb3JtQ29udHJvbCwgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoY3RybDogQWJzdHJhY3RDb250cm9sLCBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UpID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyQ29udGVudENoZWNrZWQge1xyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8taW5wdXQtcmVuYW1lXHJcbiAgQElucHV0KCdzdWJGb3JtJykgZm9ybUdyb3VwITogVHlwZWRTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IHRydWU7XHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSB0cnVlO1xyXG5cclxuICAvLyBjYW4ndCBkZWZpbmUgdGhlbSBkaXJlY3RseVxyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRGb3JtQ29udHJvbHMoKTogQ29udHJvbHM8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUNvbnRyb2xOYW1lcygpOiBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3IgYXMgc3ludGF4XHJcbiAgICByZXR1cm4gdGhpcy5tYXBDb250cm9scyhcclxuICAgICAgKF8sIGtleSkgPT4ga2V5LFxyXG4gICAgICAoKSA9PiB0cnVlLFxyXG4gICAgICBmYWxzZSxcclxuICAgICkgYXMgQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcclxuICAgIGlmIChjaGFuZ2VzWydkYXRhSW5wdXQnXSA9PT0gdW5kZWZpbmVkICYmIGNoYW5nZXNbJ2Zvcm1Hcm91cCddID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMuZm9ybUdyb3VwIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IG5lZWRzIHRvIGJlIG9mIHR5cGUgU3ViRm9ybUdyb3VwLicpO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlbW92ZUNvbnRyb2woa2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YkZvcm0gPSB0aGlzLmZvcm1Hcm91cDtcclxuXHJcbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb250cm9scykge1xyXG4gICAgICBpZiAoY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBjb250cm9sc1trZXldO1xyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHdpcmUgdXAgdGhlIGZvcm0gY29udHJvbHMgd2l0aCB0aGUgc3ViIGZvcm0gZ3JvdXBcclxuICAgICAgICAvLyB0aGlzIGFsbG93cyB1cyB0byB0cmFuc2Zvcm0gdGhlIHN1YiBmb3JtIHZhbHVlIHRvIENvbnRyb2xJbnRlcmZhY2VcclxuICAgICAgICAvLyBldmVyeSB0aW1lIGFueSBvZiB0aGUgZm9ybSBjb250cm9scyBvbiB0aGUgc3ViIGZvcm0gY2hhbmdlXHJcbiAgICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQ29udHJvbCkge1xyXG4gICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbChzdWJGb3JtLCBjb250cm9sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmFkZENvbnRyb2woa2V5LCBjb250cm9sKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbm5lY3Qgc3ViIGZvcm0gZ3JvdXAgd2l0aCBjdXJyZW50IHN1Yi1mb3JtLWNvbXBvbmVudFxyXG4gICAgc3ViRm9ybS5zZXRTdWJGb3JtKHRoaXMpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCkgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucztcclxuXHJcbiAgICBjb25zdCB2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbltdID0gW107XHJcbiAgICBjb25zdCBhc3luY1ZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG5cclxuICAgIC8vIGdldCB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGFzeW5jIHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcikge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBBYnN0cmFjdENvbnRyb2xPcHRpb25zIGZyb20gZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uKSB7XHJcbiAgICAgICAgLy8gc2FkbHkgdGhlcmUgaXMgbm8gcHVibGljIG1ldG9oZCB0aGF0IGxldHMgdXMgY2hhbmdlIHRoZSB1cGRhdGUgc3RyYXRlZ3kgb2YgYW4gYWxyZWFkeSBjcmVhdGVkIEZvcm1Hcm91cFxyXG4gICAgICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpLl9zZXRVcGRhdGVTdHJhdGVneShvcHRpb25zLnVwZGF0ZU9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKG9wdGlvbnMudmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB2YWxpZGF0b3JzIC8gYXN5bmMgdmFsaWRhdG9ycyBvbiBzdWIgZm9ybSBncm91cFxyXG4gICAgaWYgKHZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWxpZGF0b3JzKHZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFzeW5jVmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldEFzeW5jVmFsaWRhdG9ycyhhc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIC8vIGdldCBkZWZhdWx0IHZhbHVlcyBmb3IgcmVzZXQsIGlmIG51bGwgZmFsbGJhY2sgdG8gdW5kZWZpbmVkIGFzIHRoZXJlIHNpIGEgZGlmZmVyZW5jZSB3aGVuIGNhbGxpbmcgcmVzZXRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyBhcyBGb3JtSW50ZXJmYWNlKSB8fCB1bmRlZmluZWQ7XHJcbiAgICAvLyBzaW5jZSB0aGlzIGlzIHRoZSBpbml0aWFsIHNldHRpbmcgb2YgZm9ybSB2YWx1ZXMgZG8gTk9UIGVtaXQgYW4gZXZlbnRcclxuXHJcbiAgICBsZXQgbWVyZ2VkVmFsdWVzOiBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodHJhbnNmb3JtZWRWYWx1ZSkpIHtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0gc3ViRm9ybS5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBjb250cm9sVmFsdWUgPSAoY2hhbmdlc1snZGF0YUlucHV0J10gPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSB8fCB7fTtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0geyAuLi50cmFuc2Zvcm1lZFZhbHVlLCAuLi5jb250cm9sVmFsdWUgfSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpOiB2b2lkIHtcclxuICAgIC8vIFRPRE8gdGhpcyBydW5zIHRvbyBvZnRlbiwgZmluZCBvdXQgb2YgdGhpcyBjYW4gYmUgdHJpZ2dlcmVkIGRpZmZlcmVudGx5XHJcbiAgICAvLyBjaGVja2luZyBpZiB0aGUgZm9ybSBncm91cCBoYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgKHJvb3QgZm9ybXMgbWlnaHQgbm90KVxyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwLmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVGb3JtQXJyYXlDb250cm9scyhvYmo6IGFueSkge1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGNhbiBzdGlsbCBoYXBwZW4sIGl0IGFwcHJlYWRlZCBkdXJpbmcgZGV2ZWxvcG1lbnQuIG1pZ2h0IGFsZXJhZHkgYmUgZml4ZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2wodmFsdWVbaV0pO1xyXG4gICAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHRoaXMuZm9ybUdyb3VwLCBjb250cm9sKTtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCBjb250cm9sKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKTogdGhpcyBpcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHR5cGVvZiAoKHRoaXMgYXMgdW5rbm93bikgYXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+KS5jcmVhdGVGb3JtQXJyYXlDb250cm9sID09PSAnZnVuY3Rpb24nO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHVibGljIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4pID0+IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+IHtcclxuICAgIHJldHVybiBvYnMkID0+IG9icyQ7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKG9iaiBhcyBhbnkpIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAoZm9ybVZhbHVlIGFzIGFueSkgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=