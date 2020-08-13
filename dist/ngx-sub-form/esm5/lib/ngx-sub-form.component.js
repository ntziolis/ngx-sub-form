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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFzUTFDLENBQUM7SUFqUUMsc0JBQVcsaURBQWdCO2FBQTNCO1lBQ0UsK0NBQStDO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsVUFBQyxDQUFDLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxFQUFILENBQUcsRUFDZixjQUFNLE9BQUEsSUFBSSxFQUFKLENBQUksRUFDVixLQUFLLENBQzBCLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRCx5Q0FBVyxHQUFYLFVBQVksT0FBc0I7UUFBbEMsaUJBb0hDO1FBbkhDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVFLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lB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LGdEQUFrQixHQUF6QjtRQUNFLE9BQU8sVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLEVBQUosQ0FBSSxDQUFDO0lBQ3RCLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLGtEQUFvQixHQUE5QixVQUNFLEdBQTRCLEVBQzVCLGFBQTRDO1FBRTVDLE9BQVEsR0FBNEIsQ0FBQztJQUN2QyxDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLHlDQUF5QztJQUMvQixvREFBc0IsR0FBaEMsVUFBaUMsU0FBd0I7UUFDdkQsT0FBUSxTQUFxQyxDQUFDO0lBQ2hELENBQUM7SUF4UWlCO1FBQWpCLEtBQUssQ0FBQyxTQUFTLENBQUM7OzBEQUFnRTtJQVA3RCxtQkFBbUI7UUFGeEMsU0FBUyxFQUFFO1FBQ1osbURBQW1EO09BQzdCLG1CQUFtQixDQWdSeEM7SUFBRCwwQkFBQztDQUFBLEFBaFJELElBZ1JDO1NBaFJxQixtQkFBbUI7QUFvUnpDO0lBQXdGLDRDQUd2RjtJQUpELG1EQUFtRDtJQUNuRDs7SUFTQSxDQUFDO0lBVHFCLHdCQUF3QjtRQUY3QyxTQUFTLEVBQUU7UUFDWixtREFBbUQ7T0FDN0Isd0JBQXdCLENBUzdDO0lBQUQsK0JBQUM7Q0FBQSxBQVRELENBQXdGLG1CQUFtQixHQVMxRztTQVRxQix3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlckNvbnRlbnRDaGVja2VkLCBEaXJlY3RpdmUsIElucHV0LCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1BcnJheSxcclxuICBGb3JtQ29udHJvbCxcclxuICBWYWxpZGF0b3JGbixcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuXHJcbmltcG9ydCB7IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3IsIGNvZXJjZVRvVmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdC1jb250cm9sLXV0aWxzJztcclxuaW1wb3J0IHtcclxuICBBcnJheVByb3BlcnR5S2V5LFxyXG4gIENvbnRyb2xNYXAsXHJcbiAgQ29udHJvbHMsXHJcbiAgQ29udHJvbHNOYW1lcyxcclxuICBDb250cm9sc1R5cGUsXHJcbiAgaXNOdWxsT3JVbmRlZmluZWQsXHJcbiAgVHlwZWRBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5pbXBvcnQgeyBGb3JtR3JvdXBPcHRpb25zLCBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHMsIFR5cGVkU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0udHlwZXMnO1xyXG5pbXBvcnQgeyBwYXRjaEZvcm1Db250cm9sLCBTdWJGb3JtR3JvdXAgfSBmcm9tICcuL3N1Yi1mb3JtLWdyb3VwJztcclxuXHJcbnR5cGUgTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPiA9IChjdHJsOiBBYnN0cmFjdENvbnRyb2wsIGtleToga2V5b2YgRm9ybUludGVyZmFjZSkgPT4gTWFwVmFsdWU7XHJcbnR5cGUgRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKFxyXG4gIGN0cmw6IFR5cGVkQWJzdHJhY3RDb250cm9sPGFueT4sXHJcbiAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlLFxyXG4gIGlzQ3RybFdpdGhpbkZvcm1BcnJheTogYm9vbGVhbixcclxuKSA9PiBib29sZWFuO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50Q2hlY2tlZCB7XHJcbiAgLy8gd2hlbiBkZXZlbG9waW5nIHRoZSBsaWIgaXQncyBhIGdvb2QgaWRlYSB0byBzZXQgdGhlIGZvcm1Hcm91cCB0eXBlXHJcbiAgLy8gdG8gY3VycmVudCArIGB8IHVuZGVmaW5lZGAgdG8gY2F0Y2ggYSBidW5jaCBvZiBwb3NzaWJsZSBpc3N1ZXNcclxuICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWRcclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1pbnB1dC1yZW5hbWVcclxuICBASW5wdXQoJ3N1YkZvcm0nKSBmb3JtR3JvdXAhOiBUeXBlZFN1YkZvcm1Hcm91cDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHJvdGVjdGVkIGVtaXROdWxsT25EZXN0cm95ID0gdHJ1ZTtcclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IHRydWU7XHJcblxyXG4gIC8vIGNhbid0IGRlZmluZSB0aGVtIGRpcmVjdGx5XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEZvcm1Db250cm9scygpOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHVibGljIGdldCBmb3JtQ29udHJvbE5hbWVzKCk6IENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkIGZvciBhcyBzeW50YXhcclxuICAgIHJldHVybiB0aGlzLm1hcENvbnRyb2xzKFxyXG4gICAgICAoXywga2V5KSA9PiBrZXksXHJcbiAgICAgICgpID0+IHRydWUsXHJcbiAgICAgIGZhbHNlLFxyXG4gICAgKSBhcyBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+O1xyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgaWYgKGNoYW5nZXNbJ2RhdGFJbnB1dCddID09PSB1bmRlZmluZWQgJiYgY2hhbmdlc1snZm9ybUdyb3VwJ10gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IHdhcyBub3QgcHJvdmlkZWQgYnV0IGlzIHJlcXVpcmVkLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMuZm9ybUdyb3VwIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IG5lZWRzIHRvIGJlIG9mIHR5cGUgU3ViRm9ybUdyb3VwLicpO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlbW92ZUNvbnRyb2woa2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YkZvcm0gPSB0aGlzLmZvcm1Hcm91cDtcclxuXHJcbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb250cm9scykge1xyXG4gICAgICBpZiAoY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBjb250cm9sc1trZXldO1xyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHdpcmUgdXAgdGhlIGZvcm0gY29udHJvbHMgd2l0aCB0aGUgc3ViIGZvcm0gZ3JvdXBcclxuICAgICAgICAvLyB0aGlzIGFsbG93cyB1cyB0byB0cmFuc2Zvcm0gdGhlIHN1YiBmb3JtIHZhbHVlIHRvIENvbnRyb2xJbnRlcmZhY2VcclxuICAgICAgICAvLyBldmVyeSB0aW1lIGFueSBvZiB0aGUgZm9ybSBjb250cm9scyBvbiB0aGUgc3ViIGZvcm0gY2hhbmdlXHJcbiAgICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQ29udHJvbCkge1xyXG4gICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbChzdWJGb3JtLCBjb250cm9sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmFkZENvbnRyb2woa2V5LCBjb250cm9sKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbm5lY3Qgc3ViIGZvcm0gZ3JvdXAgd2l0aCBjdXJyZW50IHN1Yi1mb3JtLWNvbXBvbmVudFxyXG4gICAgc3ViRm9ybS5zZXRTdWJGb3JtKHRoaXMpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCkgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucztcclxuXHJcbiAgICBjb25zdCB2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbltdID0gW107XHJcbiAgICBjb25zdCBhc3luY1ZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG5cclxuICAgIC8vIGdldCB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGFzeW5jIHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcikge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBBYnN0cmFjdENvbnRyb2xPcHRpb25zIGZyb20gZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uKSB7XHJcbiAgICAgICAgLy8gc2FkbHkgdGhlcmUgaXMgbm8gcHVibGljIG1ldG9oZCB0aGF0IGxldHMgdXMgY2hhbmdlIHRoZSB1cGRhdGUgc3RyYXRlZ3kgb2YgYW4gYWxyZWFkeSBjcmVhdGVkIEZvcm1Hcm91cFxyXG4gICAgICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpLl9zZXRVcGRhdGVTdHJhdGVneShvcHRpb25zLnVwZGF0ZU9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKG9wdGlvbnMudmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB2YWxpZGF0b3JzIC8gYXN5bmMgdmFsaWRhdG9ycyBvbiBzdWIgZm9ybSBncm91cFxyXG4gICAgaWYgKHZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWxpZGF0b3JzKHZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFzeW5jVmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldEFzeW5jVmFsaWRhdG9ycyhhc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIC8vIGdldCBkZWZhdWx0IHZhbHVlcyBmb3IgcmVzZXQsIGlmIG51bGwgZmFsbGJhY2sgdG8gdW5kZWZpbmVkIGFzIHRoZXJlIHNpIGEgZGlmZmVyZW5jZSB3aGVuIGNhbGxpbmcgcmVzZXRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyBhcyBGb3JtSW50ZXJmYWNlKSB8fCB1bmRlZmluZWQ7XHJcbiAgICAvLyBzaW5jZSB0aGlzIGlzIHRoZSBpbml0aWFsIHNldHRpbmcgb2YgZm9ybSB2YWx1ZXMgZG8gTk9UIGVtaXQgYW4gZXZlbnRcclxuXHJcbiAgICBsZXQgbWVyZ2VkVmFsdWVzOiBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodHJhbnNmb3JtZWRWYWx1ZSkpIHtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0gc3ViRm9ybS5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBjb250cm9sVmFsdWUgPSAoY2hhbmdlc1snZGF0YUlucHV0J10gPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSB8fCB7fTtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0geyAuLi50cmFuc2Zvcm1lZFZhbHVlLCAuLi5jb250cm9sVmFsdWUgfSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpOiB2b2lkIHtcclxuICAgIC8vIFRPRE8gdGhpcyBydW5zIHRvbyBvZnRlbiwgZmluZCBvdXQgb2YgdGhpcyBjYW4gYmUgdHJpZ2dlcmVkIGRpZmZlcmVudGx5XHJcbiAgICAvLyBjaGVja2luZyBpZiB0aGUgZm9ybSBncm91cCBoYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgKHJvb3QgZm9ybXMgbWlnaHQgbm90KVxyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwPy5jZCkge1xyXG4gICAgICAvLyBpZiB0aGlzIGlzIHRoZSByb290IGZvcm1cclxuICAgICAgLy8gT1IgaWYgaXN0IGEgc3ViIGZvcm0gYnV0IHRoZSByb290IGZvcm0gZG9lcyBub3QgaGF2ZSBhIGNoYW5nZSBkZXRlY3RvclxyXG4gICAgICAvLyB3ZSBuZWVkIHRvIGFjdHVhbGx5IHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIHZzIGp1c3QgbWFya2luZyBmb3IgY2hlY2tcclxuICAgICAgaWYgKCF0aGlzLmZvcm1Hcm91cC5wYXJlbnQpIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuY2QubWFya0ZvckNoZWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPixcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4sXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgKTogQ29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoKSA9PiB0cnVlLFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbiA9IHRydWUsXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sczogQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbHM7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHM6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGZvcm1Db250cm9scykge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtQ29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZUlmQXJyYXkgJiYgY29udHJvbCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgICAgICAgY29uc3QgdmFsdWVzOiBNYXBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZXMucHVzaChtYXBDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwICYmIHZhbHVlcy5zb21lKHggPT4gIWlzTnVsbE9yVW5kZWZpbmVkKHgpKSkge1xyXG4gICAgICAgICAgICBjb250cm9sc1trZXldID0gdmFsdWVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY29udHJvbCAmJiBmaWx0ZXJDb250cm9sKGNvbnRyb2wsIGtleSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICBjb250cm9sc1trZXldID0gbWFwQ29udHJvbChjb250cm9sLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dGVuZCB0aGlzIG1ldGhvZCB0byBwcm92aWRlIGN1c3RvbSBsb2NhbCBGb3JtR3JvdXAgbGV2ZWwgdmFsaWRhdGlvblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpOiBGb3JtR3JvdXBPcHRpb25zPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gZ2V0RGVmYXVsdFZhbHVlcyBpcyBkZWZpbmVkLCB5b3UgZG8gbm90IG5lZWQgdG8gc3BlY2lmeSB0aGUgZGVmYXVsdCB2YWx1ZXNcclxuICAvLyBpbiB5b3VyIGZvcm0gKHRoZSBvbmVzIGRlZmluZWQgd2l0aGluIHRoZSBgZ2V0Rm9ybUNvbnRyb2xzYCBtZXRob2QpXHJcbiAgcHJvdGVjdGVkIGdldERlZmF1bHRWYWx1ZXMoKTogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFuZGxlRm9ybUFycmF5Q29udHJvbHMob2JqOiBhbnkpIHtcclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgdGhpcyBjYW4gc3RpbGwgaGFwcGVuLCBpdCBhcHByZWFkZWQgZHVyaW5nIGRldmVsb3BtZW50LiBtaWdodCBhbGVyYWR5IGJlIGZpeGVkXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3QuZW50cmllcyhvYmopLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgaW5zdGFuY2VvZiBGb3JtQXJyYXkgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBjb25zdCBmb3JtQXJyYXk6IEZvcm1BcnJheSA9IHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGFzIEZvcm1BcnJheTtcclxuXHJcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBjcmVhdGluZyBhIG5ldyBhcnJheSBldmVyeSB0aW1lIGFuZCBwdXNoIGEgbmV3IEZvcm1Db250cm9sXHJcbiAgICAgICAgLy8gd2UganVzdCByZW1vdmUgb3IgYWRkIHdoYXQgaXMgbmVjZXNzYXJ5IHNvIHRoYXQ6XHJcbiAgICAgICAgLy8gLSBpdCBpcyBhcyBlZmZpY2llbnQgYXMgcG9zc2libGUgYW5kIGRvIG5vdCBjcmVhdGUgdW5uZWNlc3NhcnkgRm9ybUNvbnRyb2wgZXZlcnkgdGltZVxyXG4gICAgICAgIC8vIC0gdmFsaWRhdG9ycyBhcmUgbm90IGRlc3Ryb3llZC9jcmVhdGVkIGFnYWluIGFuZCBldmVudHVhbGx5IGZpcmUgYWdhaW4gZm9yIG5vIHJlYXNvblxyXG4gICAgICAgIHdoaWxlIChmb3JtQXJyYXkubGVuZ3RoID4gdmFsdWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICBmb3JtQXJyYXkucmVtb3ZlQXQoZm9ybUFycmF5Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZvcm1BcnJheS5sZW5ndGg7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCkpIHtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCB0aGlzLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2woa2V5IGFzIEFycmF5UHJvcGVydHlLZXk8Rm9ybUludGVyZmFjZT4sIHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gbmV3IEZvcm1Db250cm9sKHZhbHVlW2ldKTtcclxuICAgICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbCh0aGlzLmZvcm1Hcm91cCwgY29udHJvbCk7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgY29udHJvbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCk6IHRoaXMgaXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB0eXBlb2YgKCh0aGlzIGFzIHVua25vd24pIGFzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPikuY3JlYXRlRm9ybUFycmF5Q29udHJvbCA9PT0gJ2Z1bmN0aW9uJztcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gY3VzdG9taXppbmcgdGhlIGVtaXNzaW9uIHJhdGUgb2YgeW91ciBzdWIgZm9ybSBjb21wb25lbnQsIHJlbWVtYmVyIG5vdCB0byAqKm11dGF0ZSoqIHRoZSBzdHJlYW1cclxuICAvLyBpdCBpcyBzYWZlIHRvIHRocm90dGxlLCBkZWJvdW5jZSwgZGVsYXksIGV0YyBidXQgdXNpbmcgc2tpcCwgZmlyc3QsIGxhc3Qgb3IgbXV0YXRpbmcgZGF0YSBpbnNpZGVcclxuICAvLyB0aGUgc3RyZWFtIHdpbGwgY2F1c2UgaXNzdWVzIVxyXG4gIHB1YmxpYyBoYW5kbGVFbWlzc2lvblJhdGUoKTogKG9icyQ6IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+KSA9PiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gb2JzJCA9PiBvYnMkO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChvYmogYXMgYW55KSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyBhbnkpIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgfVxyXG59XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT4gZXh0ZW5kcyBOZ3hTdWJGb3JtQ29tcG9uZW50PFxyXG4gIENvbnRyb2xJbnRlcmZhY2UsXHJcbiAgRm9ybUludGVyZmFjZVxyXG4+IHtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGw7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGw7XHJcbn1cclxuIl19