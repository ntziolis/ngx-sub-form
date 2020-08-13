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
        this.ngOnChangesWasCalled = false;
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
        this.ngOnChangesWasCalled = true;
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
        if (this.ngOnChangesWasCalled && this.formGroup.cd) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRTtJQURBLG1EQUFtRDtJQUNuRDtRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDaEMseUJBQW9CLEdBQUcsS0FBSyxDQUFDO0lBbVF2QyxDQUFDO0lBOVBDLHNCQUFXLGlEQUFnQjthQUEzQjtZQUNFLCtDQUErQztZQUMvQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQ3JCLFVBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSyxPQUFBLEdBQUcsRUFBSCxDQUFHLEVBQ2YsY0FBTSxPQUFBLElBQUksRUFBSixDQUFJLEVBQ1YsS0FBSyxDQUMwQixDQUFDO1FBQ3BDLENBQUM7OztPQUFBO0lBRUQseUNBQVcsR0FBWCxVQUFZLE9BQXNCO1FBQWxDLGlCQWlIQztRQWhIQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtB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ekIsZ0RBQWtCLEdBQXpCO1FBQ0UsT0FBTyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksRUFBSixDQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx5Q0FBeUM7SUFDL0Isa0RBQW9CLEdBQTlCLFVBQ0UsR0FBNEIsRUFDNUIsYUFBNEM7UUFFNUMsT0FBUSxHQUE0QixDQUFDO0lBQ3ZDLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLG9EQUFzQixHQUFoQyxVQUFpQyxTQUF3QjtRQUN2RCxPQUFRLFNBQXFDLENBQUM7SUFDaEQsQ0FBQztJQXRRaUI7UUFBakIsS0FBSyxDQUFDLFNBQVMsQ0FBQzs7MERBQWdFO0lBUDdELG1CQUFtQjtRQUZ4QyxTQUFTLEVBQUU7UUFDWixtREFBbUQ7T0FDN0IsbUJBQW1CLENBOFF4QztJQUFELDBCQUFDO0NBQUEsQUE5UUQsSUE4UUM7U0E5UXFCLG1CQUFtQjtBQWtSekM7SUFBd0YsNENBR3ZGO0lBSkQsbURBQW1EO0lBQ25EOztJQVNBLENBQUM7SUFUcUIsd0JBQXdCO1FBRjdDLFNBQVMsRUFBRTtRQUNaLG1EQUFtRDtPQUM3Qix3QkFBd0IsQ0FTN0M7SUFBRCwrQkFBQztDQUFBLEFBVEQsQ0FBd0YsbUJBQW1CLEdBUzFHO1NBVHFCLHdCQUF3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyQ29udGVudENoZWNrZWQsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgRm9ybUFycmF5LFxyXG4gIEZvcm1Db250cm9sLFxyXG4gIFZhbGlkYXRvckZuLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgY29lcmNlVG9Bc3luY1ZhbGlkYXRvciwgY29lcmNlVG9WYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0LWNvbnRyb2wtdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIEFycmF5UHJvcGVydHlLZXksXHJcbiAgQ29udHJvbE1hcCxcclxuICBDb250cm9scyxcclxuICBDb250cm9sc05hbWVzLFxyXG4gIENvbnRyb2xzVHlwZSxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IHBhdGNoRm9ybUNvbnRyb2wsIFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKGN0cmw6IEFic3RyYWN0Q29udHJvbCwga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlKSA9PiBNYXBWYWx1ZTtcclxudHlwZSBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoXHJcbiAgY3RybDogVHlwZWRBYnN0cmFjdENvbnRyb2w8YW55PixcclxuICBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UsXHJcbiAgaXNDdHJsV2l0aGluRm9ybUFycmF5OiBib29sZWFuLFxyXG4pID0+IGJvb2xlYW47XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRDaGVja2VkIHtcclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG5cclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWlucHV0LXJlbmFtZVxyXG4gIEBJbnB1dCgnc3ViRm9ybScpIGZvcm1Hcm91cCE6IFR5cGVkU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSB0cnVlO1xyXG4gIHByb3RlY3RlZCBlbWl0SW5pdGlhbFZhbHVlT25Jbml0ID0gdHJ1ZTtcclxuICBwcml2YXRlIG5nT25DaGFuZ2VzV2FzQ2FsbGVkID0gZmFsc2U7XHJcblxyXG4gIC8vIGNhbid0IGRlZmluZSB0aGVtIGRpcmVjdGx5XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEZvcm1Db250cm9scygpOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHVibGljIGdldCBmb3JtQ29udHJvbE5hbWVzKCk6IENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkIGZvciBhcyBzeW50YXhcclxuICAgIHJldHVybiB0aGlzLm1hcENvbnRyb2xzKFxyXG4gICAgICAoXywga2V5KSA9PiBrZXksXHJcbiAgICAgICgpID0+IHRydWUsXHJcbiAgICAgIGZhbHNlLFxyXG4gICAgKSBhcyBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+O1xyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgdGhpcy5uZ09uQ2hhbmdlc1dhc0NhbGxlZCA9IHRydWU7XHJcbiAgICBpZiAoY2hhbmdlc1snZGF0YUlucHV0J10gPT09IHVuZGVmaW5lZCAmJiBjaGFuZ2VzWydmb3JtR3JvdXAnXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISh0aGlzLmZvcm1Hcm91cCBpbnN0YW5jZW9mIFN1YkZvcm1Hcm91cCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgc3ViRm9ybSBpbnB1dCBuZWVkcyB0byBiZSBvZiB0eXBlIFN1YkZvcm1Hcm91cC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1Hcm91cC5jb250cm9scykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZW1vdmVDb250cm9sKGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJGb3JtID0gdGhpcy5mb3JtR3JvdXA7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udHJvbHMpIHtcclxuICAgICAgaWYgKGNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gY29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3aXJlIHVwIHRoZSBmb3JtIGNvbnRyb2xzIHdpdGggdGhlIHN1YiBmb3JtIGdyb3VwXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNmb3JtIHRoZSBzdWIgZm9ybSB2YWx1ZSB0byBDb250cm9sSW50ZXJmYWNlXHJcbiAgICAgICAgLy8gZXZlcnkgdGltZSBhbnkgb2YgdGhlIGZvcm0gY29udHJvbHMgb24gdGhlIHN1YiBmb3JtIGNoYW5nZVxyXG4gICAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgRm9ybUNvbnRyb2wpIHtcclxuICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2woc3ViRm9ybSwgY29udHJvbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5hZGRDb250cm9sKGtleSwgY29udHJvbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25uZWN0IHN1YiBmb3JtIGdyb3VwIHdpdGggY3VycmVudCBzdWItZm9ybS1jb21wb25lbnRcclxuICAgIHN1YkZvcm0uc2V0U3ViRm9ybSh0aGlzKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdG9yczogVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG4gICAgY29uc3QgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZuW10gPSBbXTtcclxuXHJcbiAgICAvLyBnZXQgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cykge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cyk7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBhc3luYyB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgQWJzdHJhY3RDb250cm9sT3B0aW9ucyBmcm9tIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbikge1xyXG4gICAgICAgIC8vIHNhZGx5IHRoZXJlIGlzIG5vIHB1YmxpYyBtZXRvaGQgdGhhdCBsZXRzIHVzIGNoYW5nZSB0aGUgdXBkYXRlIHN0cmF0ZWd5IG9mIGFuIGFscmVhZHkgY3JlYXRlZCBGb3JtR3JvdXBcclxuICAgICAgICAodGhpcy5mb3JtR3JvdXAgYXMgYW55KS5fc2V0VXBkYXRlU3RyYXRlZ3kob3B0aW9ucy51cGRhdGVPbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihvcHRpb25zLnZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihvcHRpb25zLmFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdmFsaWRhdG9ycyAvIGFzeW5jIHZhbGlkYXRvcnMgb24gc3ViIGZvcm0gZ3JvdXBcclxuICAgIGlmICh2YWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0VmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcclxuICAgIH1cclxuICAgIGlmIChhc3luY1ZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGUgZm9ybSBoYXMgZGVmYXVsdCB2YWx1ZXMsIHRoZXkgc2hvdWxkIGJlIGFwcGxpZWQgc3RyYWlnaHQgYXdheVxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKTtcclxuXHJcbiAgICAvLyBnZXQgZGVmYXVsdCB2YWx1ZXMgZm9yIHJlc2V0LCBpZiBudWxsIGZhbGxiYWNrIHRvIHVuZGVmaW5lZCBhcyB0aGVyZSBzaSBhIGRpZmZlcmVuY2Ugd2hlbiBjYWxsaW5nIHJlc2V0XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMgYXMgRm9ybUludGVyZmFjZSkgfHwgdW5kZWZpbmVkO1xyXG4gICAgLy8gc2luY2UgdGhpcyBpcyB0aGUgaW5pdGlhbCBzZXR0aW5nIG9mIGZvcm0gdmFsdWVzIGRvIE5PVCBlbWl0IGFuIGV2ZW50XHJcblxyXG4gICAgbGV0IG1lcmdlZFZhbHVlczogQ29udHJvbEludGVyZmFjZTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRyYW5zZm9ybWVkVmFsdWUpKSB7XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHN1YkZvcm0uY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgY29udHJvbFZhbHVlID0gKGNoYW5nZXNbJ2RhdGFJbnB1dCddID8gKHRoaXMgYXMgYW55KVsnZGF0YUlucHV0J10gOiBzdWJGb3JtLmNvbnRyb2xWYWx1ZSkgfHwge307XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHsgLi4udHJhbnNmb3JtZWRWYWx1ZSwgLi4uY29udHJvbFZhbHVlIH0gYXMgQ29udHJvbEludGVyZmFjZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtVmFsdWUgPSB0aGlzLnRyYW5zZm9ybVRvRm9ybUdyb3VwKG1lcmdlZFZhbHVlcywge30pO1xyXG4gICAgdGhpcy5oYW5kbGVGb3JtQXJyYXlDb250cm9scyhmb3JtVmFsdWUpO1xyXG5cclxuICAgIC8vIHNlbGYgPSBmYWxzZSBpcyBjcml0aWNhbCBoZXJlXHJcbiAgICAvLyB0aGlzIGFsbG93cyB0aGUgcGFyZW50IGZvcm0gdG8gcmUtZXZhbHVhdGUgaXRzIHN0YXR1cyBhZnRlciBlYWNoIG9mIGl0cyBzdWIgZm9ybSBoYXMgY29tcGxldGVkIGludGlhbGl6YXRpb25cclxuICAgIC8vIHdlIGFjdHVhbGx5IG9ubHkgbmVlZCB0byBjYWxsIHRoaXMgb24gdGhlIGRlZXBlc3Qgc3ViIGZvcm0gaW4gYSB0cmVlIChsZWF2ZXMpXHJcbiAgICAvLyBidXQgdGhlcmUgaXMgbm8gd2F5IHRvIGlkZW50aWZ5IGlmIHRoZXJlIGFyZSBzdWIgZm9ybXMgb24gdGhlIGN1cnJlbnQgZm9ybSArIHRoYXQgYXJlIGFsc28gcmVuZGVyZWRcclxuICAgIC8vIGFzIG9ubHkgd2hlbiBzdWIgZm9ybXMgYXJlIHJlbmRlcmVkIHRoZSBvbiBjaGFuZ2VzIG1ldGhvZCBvbiB0aGUgc3ViIGZvcm0gaXMgZXhlY3V0ZWRcclxuXHJcbiAgICAvLyBUT0RPIGRlY2lkZSBpZiB3ZSB3YW50IHRvIGVtaXQgYW4gZXZlbnQgd2hlbiBpbnB1dCBjb250cm9sIHZhbHVlICE9IGNvbnRyb2wgdmFsdWUgYWZ0ZXIgaW50aWFsaXphdGlvblxyXG4gICAgLy8gdGhpcyBoYXBwZW5zIGZvciBleGFtcGxlIHdoZW4gbnVsbCBpcyBwYXNzZWQgaW4gYnV0IGRlZmF1bHQgdmFsdWVzIGNoYW5nZSB0aGUgdmFsdWUgb2YgdGhlIGlubmVyIGZvcm1cclxuICAgIHRoaXMuZm9ybUdyb3VwLnJlc2V0KG1lcmdlZFZhbHVlcywgeyBvbmx5U2VsZjogZmFsc2UsIGVtaXRFdmVudDogZmFsc2UgfSk7XHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPIHRoaXMgcnVucyB0b28gb2Z0ZW4sIGZpbmQgb3V0IG9mIHRoaXMgY2FuIGJlIHRyaWdnZXJlZCBkaWZmZXJlbnRseVxyXG4gICAgLy8gY2hlY2tpbmcgaWYgdGhlIGZvcm0gZ3JvdXAgaGFzIGEgY2hhbmdlIGRldGVjdG9yIChyb290IGZvcm1zIG1pZ2h0IG5vdClcclxuICAgIGlmICh0aGlzLm5nT25DaGFuZ2VzV2FzQ2FsbGVkICYmIHRoaXMuZm9ybUdyb3VwLmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+LFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbixcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICApOiBDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4gfCBudWxsO1xyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9ICgpID0+IHRydWUsXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuID0gdHJ1ZSxcclxuICApOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gfCBudWxsIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZm9ybUNvbnRyb2xzOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmZvcm1Hcm91cC5jb250cm9scztcclxuXHJcbiAgICBjb25zdCBjb250cm9sczogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZm9ybUNvbnRyb2xzKSB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5jb250cm9scy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbCA9IGZvcm1Db250cm9sc1trZXldO1xyXG5cclxuICAgICAgICBpZiAocmVjdXJzaXZlSWZBcnJheSAmJiBjb250cm9sIGluc3RhbmNlb2YgRm9ybUFycmF5KSB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZXM6IE1hcFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRyb2wubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbnRyb2woY29udHJvbC5hdChpKSwga2V5LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hcENvbnRyb2woY29udHJvbC5hdChpKSwga2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDAgJiYgdmFsdWVzLnNvbWUoeCA9PiAhaXNOdWxsT3JVbmRlZmluZWQoeCkpKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb250cm9sICYmIGZpbHRlckNvbnRyb2woY29udHJvbCwga2V5LCBmYWxzZSkpIHtcclxuICAgICAgICAgIGNvbnRyb2xzW2tleV0gPSBtYXBDb250cm9sKGNvbnRyb2wsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYW5kbGVGb3JtQXJyYXlDb250cm9scyhvYmo6IGFueSkge1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGNhbiBzdGlsbCBoYXBwZW4sIGl0IGFwcHJlYWRlZCBkdXJpbmcgZGV2ZWxvcG1lbnQuIG1pZ2h0IGFsZXJhZHkgYmUgZml4ZWRcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBpbnN0YW5jZW9mIEZvcm1BcnJheSAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIGNvbnN0IGZvcm1BcnJheTogRm9ybUFycmF5ID0gdGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgYXMgRm9ybUFycmF5O1xyXG5cclxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbmV3IGFycmF5IGV2ZXJ5IHRpbWUgYW5kIHB1c2ggYSBuZXcgRm9ybUNvbnRyb2xcclxuICAgICAgICAvLyB3ZSBqdXN0IHJlbW92ZSBvciBhZGQgd2hhdCBpcyBuZWNlc3Nhcnkgc28gdGhhdDpcclxuICAgICAgICAvLyAtIGl0IGlzIGFzIGVmZmljaWVudCBhcyBwb3NzaWJsZSBhbmQgZG8gbm90IGNyZWF0ZSB1bm5lY2Vzc2FyeSBGb3JtQ29udHJvbCBldmVyeSB0aW1lXHJcbiAgICAgICAgLy8gLSB2YWxpZGF0b3JzIGFyZSBub3QgZGVzdHJveWVkL2NyZWF0ZWQgYWdhaW4gYW5kIGV2ZW50dWFsbHkgZmlyZSBhZ2FpbiBmb3Igbm8gcmVhc29uXHJcbiAgICAgICAgd2hpbGUgKGZvcm1BcnJheS5sZW5ndGggPiB2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIGZvcm1BcnJheS5yZW1vdmVBdChmb3JtQXJyYXkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gZm9ybUFycmF5Lmxlbmd0aDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5mb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKSkge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIHRoaXMuY3JlYXRlRm9ybUFycmF5Q29udHJvbChrZXkgYXMgQXJyYXlQcm9wZXJ0eUtleTxGb3JtSW50ZXJmYWNlPiwgdmFsdWVbaV0pKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2wodmFsdWVbaV0pO1xyXG4gICAgICAgICAgICBwYXRjaEZvcm1Db250cm9sKHRoaXMuZm9ybUdyb3VwLCBjb250cm9sKTtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCBjb250cm9sKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmb3JtSXNGb3JtV2l0aEFycmF5Q29udHJvbHMoKTogdGhpcyBpcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHR5cGVvZiAoKHRoaXMgYXMgdW5rbm93bikgYXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+KS5jcmVhdGVGb3JtQXJyYXlDb250cm9sID09PSAnZnVuY3Rpb24nO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBjdXN0b21pemluZyB0aGUgZW1pc3Npb24gcmF0ZSBvZiB5b3VyIHN1YiBmb3JtIGNvbXBvbmVudCwgcmVtZW1iZXIgbm90IHRvICoqbXV0YXRlKiogdGhlIHN0cmVhbVxyXG4gIC8vIGl0IGlzIHNhZmUgdG8gdGhyb3R0bGUsIGRlYm91bmNlLCBkZWxheSwgZXRjIGJ1dCB1c2luZyBza2lwLCBmaXJzdCwgbGFzdCBvciBtdXRhdGluZyBkYXRhIGluc2lkZVxyXG4gIC8vIHRoZSBzdHJlYW0gd2lsbCBjYXVzZSBpc3N1ZXMhXHJcbiAgcHVibGljIGhhbmRsZUVtaXNzaW9uUmF0ZSgpOiAob2JzJDogT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4pID0+IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+IHtcclxuICAgIHJldHVybiBvYnMkID0+IG9icyQ7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKG9iaiBhcyBhbnkpIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvLyB0aGF0IG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiBpZiB0aGVcclxuICAvLyBzaGFwZSBvZiB0aGUgZm9ybSBuZWVkcyB0byBiZSBtb2RpZmllZFxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAoZm9ybVZhbHVlIGFzIGFueSkgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcbn1cclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPiBleHRlbmRzIE5neFN1YkZvcm1Db21wb25lbnQ8XHJcbiAgQ29udHJvbEludGVyZmFjZSxcclxuICBGb3JtSW50ZXJmYWNlXHJcbj4ge1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbDtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbDtcclxufVxyXG4iXX0=