import { __extends, __assign, __values, __read, __decorate, __metadata } from 'tslib';
import { InjectionToken, forwardRef, EventEmitter, Input, Directive, ChangeDetectorRef, NgModule } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { timer, Subject, combineLatest } from 'rxjs';
import { debounce, takeUntil, filter, tap, startWith } from 'rxjs/operators';
import isEqual from 'fast-deep-equal';
import { CommonModule } from '@angular/common';

// ----------------------------------------------------------------------------------------
// no need to expose that token out of the lib, do not export that file from public_api.ts!
// ----------------------------------------------------------------------------------------
// see https://github.com/angular/angular/issues/8277#issuecomment-263029485
// this basically allows us to access the host component
// from a directive without knowing the type of the component at run time
var SUB_FORM_COMPONENT_TOKEN = new InjectionToken('NgxSubFormComponentToken');

function subformComponentProviders(component) {
    return [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(function () { return component; }),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(function () { return component; }),
            multi: true,
        },
        {
            provide: SUB_FORM_COMPONENT_TOKEN,
            useExisting: forwardRef(function () { return component; }),
        },
    ];
}
var wrapAsQuote = function (str) { return "\"" + str + "\""; };
var ɵ0 = wrapAsQuote;
var MissingFormControlsError = /** @class */ (function (_super) {
    __extends(MissingFormControlsError, _super);
    function MissingFormControlsError(missingFormControls) {
        return _super.call(this, "Attempt to update the form value with an object that doesn't contains some of the required form control keys.\nMissing: " + missingFormControls
            .map(wrapAsQuote)
            .join(", ")) || this;
    }
    return MissingFormControlsError;
}(Error));
var ɵ1 = function (time) { return function (obs) {
    return obs.pipe(debounce(function () { return timer(time); }));
}; };
var NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES = {
    debounce: ɵ1,
};
/**
 * Easily unsubscribe from an observable stream by appending `takeUntilDestroyed(this)` to the observable pipe.
 * If the component already has a `ngOnDestroy` method defined, it will call this first.
 * Note that the component *must* implement OnDestroy for this to work (the typings will enforce this anyway)
 */
function takeUntilDestroyed(component) {
    return function (source) {
        var onDestroy = new Subject();
        var previousOnDestroy = component.ngOnDestroy;
        component.ngOnDestroy = function () {
            if (previousOnDestroy) {
                previousOnDestroy.apply(component);
            }
            onDestroy.next();
            onDestroy.complete();
        };
        return source.pipe(takeUntil(onDestroy));
    };
}
/** @internal */
function isNullOrUndefined(obj) {
    return obj === null || obj === undefined;
}

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
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'];
        this.getDefaultValues = this.subForm['getDefaultValues'];
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
// this idea of this is that when a non sub form group is being updated the sub form group needs to be notifed
function patchFormControl(subFormGroup, control) {
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

// The following code is copied from angular source since those methods tehy are not exported
// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/directives/shared.ts
function composeValidators(validators) {
    return validators != null ? Validators.compose(validators.map(normalizeValidator)) : null;
}
function composeAsyncValidators(validators) {
    return validators != null ? Validators.composeAsync(validators.map(normalizeAsyncValidator)) : null;
}
function normalizeValidator(validator) {
    // thorws error in latest typescript version
    //if ((<Validator>validator).validate) {
    if (validator.validate) {
        return function (c) { return validator.validate(c); };
    }
    else {
        return validator;
    }
}
function normalizeAsyncValidator(validator) {
    // thorws error in latest typescript version
    //if ((<AsyncValidator>validator).validate) {
    if (validator.validate) {
        return function (c) { return validator.validate(c); };
    }
    else {
        return validator;
    }
}
// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/model.ts
function isOptionsObj(validatorOrOpts) {
    return validatorOrOpts != null && !Array.isArray(validatorOrOpts) && typeof validatorOrOpts === 'object';
}
function coerceToValidator(validatorOrOpts) {
    var validator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.validators
        : validatorOrOpts);
    return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
function coerceToAsyncValidator(asyncValidator, validatorOrOpts) {
    var origAsyncValidator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.asyncValidators
        : asyncValidator);
    return Array.isArray(origAsyncValidator) ? composeAsyncValidators(origAsyncValidator) : origAsyncValidator || null;
}

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

var NgxRootFormComponent = /** @class */ (function (_super) {
    __extends(NgxRootFormComponent, _super);
    // change detector only needs to be passed from root form
    // for sub forms the sub-form-directive injects the change detector ref for us
    function NgxRootFormComponent(cd) {
        var _this = _super.call(this) || this;
        // using a private variable `_dataOutput$` to be able to control the
        // emission rate with a debounce or throttle for ex
        /** @internal */
        _this._dataOutput$ = new Subject();
        _this.emitInitialValueOnInit = false;
        _this.emitNullOnDestroy = false;
        _this.dataValue = null;
        _this.formGroup = new SubFormGroup({});
        if (cd) {
            _this.formGroup.setChangeDetector(cd);
        }
        return _this;
    }
    // needed for take until destroyed
    NgxRootFormComponent.prototype.ngOnDestroy = function () { };
    NgxRootFormComponent.prototype.ngOnInit = function () {
        var _this = this;
        this._dataOutput$
            .pipe(takeUntilDestroyed(this), filter(function () { return _this.formGroup.valid; }), tap(function (value) { return _this.dataOutput.emit(value); }))
            .subscribe();
    };
    /** @internal */
    NgxRootFormComponent.prototype.onRegisterOnChangeHook = function (data) {
        if (this.formGroup.invalid || isEqual(data, this.dataInput)) {
            return false;
        }
        this.dataValue = data;
        return true;
    };
    NgxRootFormComponent.prototype.transformToFormGroup = function (obj, defaultValues) {
        return obj;
    };
    NgxRootFormComponent.prototype.transformFromFormGroup = function (formValue) {
        return formValue;
    };
    NgxRootFormComponent.prototype.manualSave = function () {
        // if (this.formGroup.valid) {
        //   this.dataValue = this.formGroup.controlValue;
        //   this._dataOutput$.next(this.dataValue);
        // }
        this.dataValue = this.formGroup.controlValue;
        if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
            this._dataOutput$.next(this.dataValue);
        }
    };
    NgxRootFormComponent.ctorParameters = function () { return [
        { type: ChangeDetectorRef }
    ]; };
    NgxRootFormComponent = __decorate([
        Directive()
        // tslint:disable-next-line: directive-class-suffix
        ,
        __metadata("design:paramtypes", [ChangeDetectorRef])
    ], NgxRootFormComponent);
    return NgxRootFormComponent;
}(NgxSubFormRemapComponent));

var NgxAutomaticRootFormComponent = /** @class */ (function (_super) {
    __extends(NgxAutomaticRootFormComponent, _super);
    function NgxAutomaticRootFormComponent(cd) {
        return _super.call(this, cd) || this;
    }
    NgxAutomaticRootFormComponent.prototype.ngOnInit = function () {
        var _this = this;
        _super.prototype.ngOnInit.call(this);
        var status$ = this.formGroup.statusChanges.pipe(startWith(this.formGroup.status));
        var value$ = this.formGroup.valueChanges.pipe(startWith(this.formGroup.value));
        combineLatest([status$, value$])
            .pipe(takeUntilDestroyed(this), filter(function (_a) {
            var _b = __read(_a, 2), status = _b[0], value = _b[1];
            return status === 'VALID';
        }), tap(function () { return _this.manualSave(); }))
            .subscribe();
    };
    NgxAutomaticRootFormComponent.ctorParameters = function () { return [
        { type: ChangeDetectorRef }
    ]; };
    NgxAutomaticRootFormComponent = __decorate([
        Directive()
        // tslint:disable-next-line: directive-class-suffix
        ,
        __metadata("design:paramtypes", [ChangeDetectorRef])
    ], NgxAutomaticRootFormComponent);
    return NgxAutomaticRootFormComponent;
}(NgxRootFormComponent));

var SubFormDirective = /** @class */ (function () {
    function SubFormDirective(cd) {
        this.cd = cd;
    }
    SubFormDirective.prototype.ngOnChanges = function (changes) {
        if (changes.subForm && this.subForm) {
            this.subForm.setChangeDetector(this.cd);
        }
    };
    SubFormDirective.ctorParameters = function () { return [
        { type: ChangeDetectorRef }
    ]; };
    __decorate([
        Input(),
        __metadata("design:type", SubFormGroup)
    ], SubFormDirective.prototype, "subForm", void 0);
    SubFormDirective = __decorate([
        Directive({
            selector: '[subForm]',
        }),
        __metadata("design:paramtypes", [ChangeDetectorRef])
    ], SubFormDirective);
    return SubFormDirective;
}());

var NgxSubFormModule = /** @class */ (function () {
    function NgxSubFormModule() {
    }
    NgxSubFormModule = __decorate([
        NgModule({
            declarations: [
                SubFormDirective
            ],
            imports: [
                CommonModule,
            ],
            exports: [
                SubFormDirective
            ]
        })
    ], NgxSubFormModule);
    return NgxSubFormModule;
}());

/*
 * Public API Surface of sub-form
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MissingFormControlsError, NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES, NgxAutomaticRootFormComponent, NgxRootFormComponent, NgxSubFormComponent, NgxSubFormModule, NgxSubFormRemapComponent, SubFormArray, SubFormDirective, SubFormGroup, isNullOrUndefined, patchFormControl, subformComponentProviders, takeUntilDestroyed, ɵ0, ɵ1, SUB_FORM_COMPONENT_TOKEN as ɵa };
//# sourceMappingURL=ngx-sub-form.js.map
