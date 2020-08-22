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
        if (changes['dataInput'] === undefined &&
            (changes['formGroup'] === undefined ||
                (changes['formGroup'].firstChange && !changes['formGroup'].currentValue))) {
            return;
        }
        if (!this.formGroup) {
            throw new Error('The subForm input was not provided but is required.');
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
        // // TODO this runs too often, find out of this can be triggered differently
        // // checking if the form group has a change detector (root forms might not)
        // if (this.formGroup?.cd) {
        //   // if this is the root form
        //   // OR if ist a sub form but the root form does not have a change detector
        //   // we need to actually run change detection vs just marking for check
        //   if (!this.formGroup.parent) {
        //     this.formGroup.cd.detectChanges();
        //   } else {
        //     this.formGroup.cd.markForCheck();
        //   }
        // }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUEwUTFDLENBQUM7SUFyUUMsc0JBQVcsaURBQWdCO2FBQTNCO1lBQ0UsK0NBQStDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsVUFBQyxDQUFDLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxFQUFILENBQUcsRUFDZixjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksRUFDVixLQUFLLENBQzBCLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRCx5Q0FBVyxHQUFYLFVBQVksT0FBc0I7UUFBbEMsaUJBd0hDO1FBdkhDLElBQ0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUztnQkFDakMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMs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SUFBSSxPQUFBLElBQUksRUFBSixDQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx5Q0FBeUM7SUFDL0Isa0RBQW9CLEdBQTlCLFVBQ0UsR0FBNEIsRUFDNUIsYUFBNEM7UUFFNUMsT0FBUSxHQUE0QixDQUFDO0lBQ3ZDLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLG9EQUFzQixHQUFoQyxVQUFpQyxTQUF3QjtRQUN2RCxPQUFRLFNBQXFDLENBQUM7SUFDaEQsQ0FBQztJQTVRaUI7UUFBakIsS0FBSyxDQUFDLFNBQVMsQ0FBQzs7MERBQWdFO0lBUDdELG1CQUFtQjtRQUZ4QyxTQUFTLEVBQUU7UUFDWixtREFBbUQ7T0FDN0IsbUJBQW1CLENBb1J4QztJQUFELDBCQUFDO0NBQUEsQUFwUkQsSUFvUkM7U0FwUnFCLG1CQUFtQjtBQXdSekM7SUFBd0YsNENBR3ZGO0lBSkQsbURBQW1EO0lBQ25EOztJQVNBLENBQUM7SUFUcUIsd0JBQXdCO1FBRjdDLFNBQVMsRUFBRTtRQUNaLG1EQUFtRDtPQUM3Qix3QkFBd0IsQ0FTN0M7SUFBRCwrQkFBQztDQUFBLEFBVEQsQ0FBd0YsbUJBQW1CLEdBUzFHO1NBVHFCLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyQ29udGVudENoZWNrZWQsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUFycmF5LFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIFZhbGlkYXRvckZuLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlVG9Bc3luY1ZhbGlkYXRvciwgY29lcmNlVG9WYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0LWNvbnRyb2wtdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIEFycmF5UHJvcGVydHlLZXksXHJcbiAgQ29udHJvbE1hcCxcclxuICBDb250cm9scyxcclxuICBDb250cm9sc05hbWVzLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IHBhdGNoRm9ybUNvbnRyb2wsIFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKGN0cmw6IEFic3RyYWN0Q29udHJvbCwga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlKSA9PiBNYXBWYWx1ZTtcclxudHlwZSBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbiAgaXNDdHJsV2l0aGluRm9ybUFycmF5OiBib29sZWFuLFxyXG4pID0+IGJvb2xlYW47XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRDaGVja2VkIHtcclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG5cclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWlucHV0LXJlbmFtZVxyXG4gIEBJbnB1dCgnc3ViRm9ybScpIGZvcm1Hcm91cCE6IFR5cGVkU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGNoYW5nZXNbJ2RhdGFJbnB1dCddID09PSB1bmRlZmluZWQgJiZcclxuICAgICAgKGNoYW5nZXNbJ2Zvcm1Hcm91cCddID09PSB1bmRlZmluZWQgfHxcclxuICAgICAgICAoY2hhbmdlc1snZm9ybUdyb3VwJ10uZmlyc3RDaGFuZ2UgJiYgIWNoYW5nZXNbJ2Zvcm1Hcm91cCddLmN1cnJlbnRWYWx1ZSkpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCB3YXMgbm90IHByb3ZpZGVkIGJ1dCBpcyByZXF1aXJlZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISh0aGlzLmZvcm1Hcm91cCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCBuZWVkcyB0byBiZSBvZiB0eXBlIFN1YkZvcm1Hcm91cC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1Hcm91cC5jb250cm9scykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZW1vdmVDb250cm9sKGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJGb3JtID0gdGhpcy5mb3JtR3JvdXA7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udHJvbHMpIHtcclxuICAgICAgaWYgKGNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gY29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3aXJlIHVwIHRoZSBmb3JtIGNvbnRyb2xzIHdpdGggdGhlIHN1YiBmb3JtIGdyb3VwXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNmb3JtIHRoZSBzdWIgZm9ybSB2YWx1ZSB0byBDb250cm9sSW50ZXJmYWNlXHJcbiAgICAgICAgLy8gZXZlcnkgdGltZSBhbnkgb2YgdGhlIGZvcm0gY29udHJvbHMgb24gdGhlIHN1YiBmb3JtIGNoYW5nZVxyXG4gICAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgRm9ybUNvbnRyb2wpIHtcclxuICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2woc3ViRm9ybSwgY29udHJvbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5hZGRDb250cm9sKGtleSwgY29udHJvbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25uZWN0IHN1YiBmb3JtIGdyb3VwIHdpdGggY3VycmVudCBzdWItZm9ybS1jb21wb25lbnRcclxuICAgIHN1YkZvcm0uc2V0U3ViRm9ybSh0aGlzKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdG9yczogVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG4gICAgY29uc3QgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZuW10gPSBbXTtcclxuXHJcbiAgICAvLyBnZXQgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cykge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cyk7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBhc3luYyB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgQWJzdHJhY3RDb250cm9sT3B0aW9ucyBmcm9tIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbikge1xyXG4gICAgICAgIC8vIHNhZGx5IHRoZXJlIGlzIG5vIHB1YmxpYyBtZXRvaGQgdGhhdCBsZXRzIHVzIGNoYW5nZSB0aGUgdXBkYXRlIHN0cmF0ZWd5IG9mIGFuIGFscmVhZHkgY3JlYXRlZCBGb3JtR3JvdXBcclxuICAgICAgICAodGhpcy5mb3JtR3JvdXAgYXMgYW55KS5fc2V0VXBkYXRlU3RyYXRlZ3kob3B0aW9ucy51cGRhdGVPbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihvcHRpb25zLnZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihvcHRpb25zLmFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdmFsaWRhdG9ycyAvIGFzeW5jIHZhbGlkYXRvcnMgb24gc3ViIGZvcm0gZ3JvdXBcclxuICAgIGlmICh2YWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0VmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcclxuICAgIH1cclxuICAgIGlmIChhc3luY1ZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGUgZm9ybSBoYXMgZGVmYXVsdCB2YWx1ZXMsIHRoZXkgc2hvdWxkIGJlIGFwcGxpZWQgc3RyYWlnaHQgYXdheVxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKTtcclxuXHJcbiAgICAvLyBnZXQgZGVmYXVsdCB2YWx1ZXMgZm9yIHJlc2V0LCBpZiBudWxsIGZhbGxiYWNrIHRvIHVuZGVmaW5lZCBhcyB0aGVyZSBzaSBhIGRpZmZlcmVuY2Ugd2hlbiBjYWxsaW5nIHJlc2V0XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMgYXMgRm9ybUludGVyZmFjZSkgfHwgdW5kZWZpbmVkO1xyXG4gICAgLy8gc2luY2UgdGhpcyBpcyB0aGUgaW5pdGlhbCBzZXR0aW5nIG9mIGZvcm0gdmFsdWVzIGRvIE5PVCBlbWl0IGFuIGV2ZW50XHJcblxyXG4gICAgbGV0IG1lcmdlZFZhbHVlczogQ29udHJvbEludGVyZmFjZTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRyYW5zZm9ybWVkVmFsdWUpKSB7XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHN1YkZvcm0uY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgY29udHJvbFZhbHVlID0gKGNoYW5nZXNbJ2RhdGFJbnB1dCddID8gKHRoaXMgYXMgYW55KVsnZGF0YUlucHV0J10gOiBzdWJGb3JtLmNvbnRyb2xWYWx1ZSkgfHwge307XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHsgLi4udHJhbnNmb3JtZWRWYWx1ZSwgLi4uY29udHJvbFZhbHVlIH0gYXMgQ29udHJvbEludGVyZmFjZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKG1lcmdlZFZhbHVlcywge30pO1xyXG4gICAgdGhpcy5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIC8vIHNlbGYgPSBmYWxzZSBpcyBjcml0aWNhbCBoZXJlXHJcbiAgICAvLyB0aGlzIGFsbG93cyB0aGUgcGFyZW50IGZvcm0gdG8gcmUtZXZhbHVhdGUgaXRzIHN0YXR1cyBhZnRlciBlYWNoIG9mIGl0cyBzdWIgZm9ybSBoYXMgY29tcGxldGVkIGludGlhbGl6YXRpb25cclxuICAgIC8vIHdlIGFjdHVhbGx5IG9ubHkgbmVlZCB0byBjYWxsIHRoaXMgb24gdGhlIGRlZXBlc3Qgc3ViIGZvcm0gaW4gYSB0cmVlIChsZWF2ZXMpXHJcbiAgICAvLyBidXQgdGhlcmUgaXMgbm8gd2F5IHRvIGlkZW50aWZ5IGlmIHRoZXJlIGFyZSBzdWIgZm9ybXMgb24gdGhlIGN1cnJlbnQgZm9ybSArIHRoYXQgYXJlIGFsc28gcmVuZGVyZWRcclxuICAgIC8vIGFzIG9ubHkgd2hlbiBzdWIgZm9ybXMgYXJlIHJlbmRlcmVkIHRoZSBvbiBjaGFuZ2VzIG1ldGhvZCBvbiB0aGUgc3ViIGZvcm0gaXMgZXhlY3V0ZWRcclxuXHJcbiAgICAvLyBUT0RPIGRlY2lkZSBpZiB3ZSB3YW50IHRvIGVtaXQgYW4gZXZlbnQgd2hlbiBpbnB1dCBjb250cm9sIHZhbHVlICE9IGNvbnRyb2wgdmFsdWUgYWZ0ZXIgaW50aWFsaXphdGlvblxyXG4gICAgLy8gdGhpcyBoYXBwZW5zIGZvciBleGFtcGxlIHdoZW4gbnVsbCBpcyBwYXNzZWQgaW4gYnV0IGRlZmF1bHQgdmFsdWVzIGNoYW5nZSB0aGUgdmFsdWUgb2YgdGhlIGlubmVyIGZvcm1cclxuICAgIHRoaXMuZm9ybUdyb3VwLnJlc2V0KG1lcmdlZFZhbHVlcywgeyBvbmx5U2VsZjogZmFsc2UsIGVtaXRFdmVudDogZmFsc2UgfSk7XHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKTogdm9pZCB7XHJcbiAgICAvLyAvLyBUT0RPIHRoaXMgcnVucyB0b28gb2Z0ZW4sIGZpbmQgb3V0IG9mIHRoaXMgY2FuIGJlIHRyaWdnZXJlZCBkaWZmZXJlbnRseVxyXG4gICAgLy8gLy8gY2hlY2tpbmcgaWYgdGhlIGZvcm0gZ3JvdXAgaGFzIGEgY2hhbmdlIGRldGVjdG9yIChyb290IGZvcm1zIG1pZ2h0IG5vdClcclxuICAgIC8vIGlmICh0aGlzLmZvcm1Hcm91cD8uY2QpIHtcclxuICAgIC8vICAgLy8gaWYgdGhpcyBpcyB0aGUgcm9vdCBmb3JtXHJcbiAgICAvLyAgIC8vIE9SIGlmIGlzdCBhIHN1YiBmb3JtIGJ1dCB0aGUgcm9vdCBmb3JtIGRvZXMgbm90IGhhdmUgYSBjaGFuZ2UgZGV0ZWN0b3JcclxuICAgIC8vICAgLy8gd2UgbmVlZCB0byBhY3R1YWxseSBydW4gY2hhbmdlIGRldGVjdGlvbiB2cyBqdXN0IG1hcmtpbmcgZm9yIGNoZWNrXHJcbiAgICAvLyAgIGlmICghdGhpcy5mb3JtR3JvdXAucGFyZW50KSB7XHJcbiAgICAvLyAgICAgdGhpcy5mb3JtR3JvdXAuY2QuZGV0ZWN0Q2hhbmdlcygpO1xyXG4gICAgLy8gICB9IGVsc2Uge1xyXG4gICAgLy8gICAgIHRoaXMuZm9ybUdyb3VwLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4sXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICk6IENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKCkgPT4gdHJ1ZSxcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4gPSB0cnVlLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGwge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtQ29udHJvbHM6IENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPiA9IHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBmb3JtQ29udHJvbHMpIHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybUNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIGlmIChyZWN1cnNpdmVJZkFycmF5ICYmIGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQXJyYXkpIHtcclxuICAgICAgICAgIGNvbnN0IHZhbHVlczogTWFwVmFsdWVbXSA9IFtdO1xyXG5cclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udHJvbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXksIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWVzLnB1c2gobWFwQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCAmJiB2YWx1ZXMuc29tZSh4ID0+ICFpc051bGxPclVuZGVmaW5lZCh4KSkpIHtcclxuICAgICAgICAgICAgY29udHJvbHNba2V5XSA9IHZhbHVlcztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRyb2wgJiYgZmlsdGVyQ29udHJvbChjb250cm9sLCBrZXksIGZhbHNlKSkge1xyXG4gICAgICAgICAgY29udHJvbHNba2V5XSA9IG1hcENvbnRyb2woY29udHJvbCwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29udHJvbHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRlbmQgdGhpcyBtZXRob2QgdG8gcHJvdmlkZSBjdXN0b20gbG9jYWwgRm9ybUdyb3VwIGxldmVsIHZhbGlkYXRpb25cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKTogRm9ybUdyb3VwT3B0aW9uczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGdldERlZmF1bHRWYWx1ZXMgaXMgZGVmaW5lZCwgeW91IGRvIG5vdCBuZWVkIHRvIHNwZWNpZnkgdGhlIGRlZmF1bHQgdmFsdWVzXHJcbiAgLy8gaW4geW91ciBmb3JtICh0aGUgb25lcyBkZWZpbmVkIHdpdGhpbiB0aGUgYGdldEZvcm1Db250cm9sc2AgbWV0aG9kKVxyXG4gIHByb3RlY3RlZCBnZXREZWZhdWx0VmFsdWVzKCk6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKG9iajogYW55KSB7XHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHRoaXMgY2FuIHN0aWxsIGhhcHBlbiwgaXQgYXBwcmVhZGVkIGR1cmluZyBkZXZlbG9wbWVudC4gbWlnaHQgYWxlcmFkeSBiZSBmaXhlZFxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGluc3RhbmNlb2YgRm9ybUFycmF5ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3QgZm9ybUFycmF5OiBGb3JtQXJyYXkgPSB0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBhcyBGb3JtQXJyYXk7XHJcblxyXG4gICAgICAgIC8vIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgYXJyYXkgZXZlcnkgdGltZSBhbmQgcHVzaCBhIG5ldyBGb3JtQ29udHJvbFxyXG4gICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlIG9yIGFkZCB3aGF0IGlzIG5lY2Vzc2FyeSBzbyB0aGF0OlxyXG4gICAgICAgIC8vIC0gaXQgaXMgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlIGFuZCBkbyBub3QgY3JlYXRlIHVubmVjZXNzYXJ5IEZvcm1Db250cm9sIGV2ZXJ5IHRpbWVcclxuICAgICAgICAvLyAtIHZhbGlkYXRvcnMgYXJlIG5vdCBkZXN0cm95ZWQvY3JlYXRlZCBhZ2FpbiBhbmQgZXZlbnR1YWxseSBmaXJlIGFnYWluIGZvciBubyByZWFzb25cclxuICAgICAgICB3aGlsZSAoZm9ybUFycmF5Lmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGZvcm1BcnJheS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmb3JtQXJyYXkubGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICh0aGlzLmZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpKSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgdGhpcy5jcmVhdGVGb3JtQXJyYXlDb250cm9sKGtleSBhcyBBcnJheVByb3BlcnR5S2V5PEZvcm1JbnRlcmZhY2U+LCB2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSk7XHJcbiAgICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2wodGhpcy5mb3JtR3JvdXAsIGNvbnRyb2wpO1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIGNvbnRyb2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGN1c3RvbWl6aW5nIHRoZSBlbWlzc2lvbiByYXRlIG9mIHlvdXIgc3ViIGZvcm0gY29tcG9uZW50LCByZW1lbWJlciBub3QgdG8gKiptdXRhdGUqKiB0aGUgc3RyZWFtXHJcbiAgLy8gaXQgaXMgc2FmZSB0byB0aHJvdHRsZSwgZGVib3VuY2UsIGRlbGF5LCBldGMgYnV0IHVzaW5nIHNraXAsIGZpcnN0LCBsYXN0IG9yIG11dGF0aW5nIGRhdGEgaW5zaWRlXHJcbiAgLy8gdGhlIHN0cmVhbSB3aWxsIGNhdXNlIGlzc3VlcyFcclxuICBwdWJsaWMgaGFuZGxlRW1pc3Npb25SYXRlKCk6IChvYnMkOiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPikgPT4gT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIGFueSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxufVxyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+IGV4dGVuZHMgTmd4U3ViRm9ybUNvbXBvbmVudDxcclxuICBDb250cm9sSW50ZXJmYWNlLFxyXG4gIEZvcm1JbnRlcmZhY2VcclxuPiB7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsO1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsO1xyXG59XHJcbiJdfQ==