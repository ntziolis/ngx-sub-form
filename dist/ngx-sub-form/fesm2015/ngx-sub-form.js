import { InjectionToken, forwardRef, EventEmitter, Input, Directive, ChangeDetectorRef, NgModule } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { timer, Subject, combineLatest } from 'rxjs';
import { debounce, takeUntil, filter, tap, startWith } from 'rxjs/operators';
import { __decorate, __metadata } from 'tslib';
import isEqual from 'fast-deep-equal';
import { CommonModule } from '@angular/common';

// ----------------------------------------------------------------------------------------
// no need to expose that token out of the lib, do not export that file from public_api.ts!
// ----------------------------------------------------------------------------------------
// see https://github.com/angular/angular/issues/8277#issuecomment-263029485
// this basically allows us to access the host component
// from a directive without knowing the type of the component at run time
const SUB_FORM_COMPONENT_TOKEN = new InjectionToken('NgxSubFormComponentToken');

function subformComponentProviders(component) {
    return [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => component),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => component),
            multi: true,
        },
        {
            provide: SUB_FORM_COMPONENT_TOKEN,
            useExisting: forwardRef(() => component),
        },
    ];
}
const wrapAsQuote = (str) => `"${str}"`;
const ɵ0 = wrapAsQuote;
class MissingFormControlsError extends Error {
    constructor(missingFormControls) {
        super(`Attempt to update the form value with an object that doesn't contains some of the required form control keys.\nMissing: ${missingFormControls
            .map(wrapAsQuote)
            .join(`, `)}`);
    }
}
const ɵ1 = (time) => obs => obs.pipe(debounce(() => timer(time)));
const NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES = {
    debounce: ɵ1,
};
/**
 * Easily unsubscribe from an observable stream by appending `takeUntilDestroyed(this)` to the observable pipe.
 * If the component already has a `ngOnDestroy` method defined, it will call this first.
 * Note that the component *must* implement OnDestroy for this to work (the typings will enforce this anyway)
 */
function takeUntilDestroyed(component) {
    return (source) => {
        const onDestroy = new Subject();
        const previousOnDestroy = component.ngOnDestroy;
        component.ngOnDestroy = () => {
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

class CustomEventEmitter extends EventEmitter {
    setSubForm(subForm) {
        this.subForm = subForm;
    }
    emit(value) {
        // ignore all emit values until sub form tree is initialized
        if (!this.subForm) {
            return;
        }
        this.subForm.formGroup.updateValue({ self: true });
        super.emit(this.subForm.formGroup.controlValue);
    }
}
class SubFormGroup extends FormGroup {
    constructor(value, validatorOrOpts, asyncValidator) {
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        super({});
        this.isRoot = false;
        // this is how to overwrite a propetotype property
        //   Object.defineProperty(foo, "bar", {
        //     // only returns odd die sides
        //     get: function () { return (Math.random() * 6) | 1; }
        // });
        this.controlValue = (value || undefined);
        this._valueChanges = new CustomEventEmitter();
        this.valueChanges = this._valueChanges;
        this.parentValidatorOrOpts = validatorOrOpts;
        this.parentAsyncValidator = asyncValidator;
    }
    setChangeDetector(cd) {
        this.cd = cd;
    }
    get value() {
        // if (!this.subForm) {
        //   return null;
        // }
        // const transformedValue = (this.transformFromFormGroup(
        //   (super.value as any) as TForm,
        // ) as unknown) as TControl;
        // return transformedValue;
        return this.controlValue;
    }
    // this method is being called from angular code only with value of _reduceValue() which returns the current controlValue
    set value(value) {
        if (!this.subForm) {
            return;
        }
        const controlValue = value; //this.transformFromFormGroup((value as unknown) as TForm) as TControl;
        this.controlValue = controlValue;
        // @ts-ignore
        super.value = controlValue;
    }
    setSubForm(subForm) {
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        if (this.root === this) {
            this.isRoot = true;
        }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = (obj, defaultValues) => {
            return this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    }
    getRawValue() {
        const rawValue = super.getRawValue();
        return this.transformFromFormGroup(rawValue);
    }
    setValue(value, options = {}) {
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
        const formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.patchValue(formValue, options);
    }
    patchValue(value, options = {}) {
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
        this.controlValue = Object.assign(Object.assign({}, this.controlValue), value);
        // TODO check if providing {} does work, as we do not want to override existing values with default values
        // It might be that patchValue cannot be used as we dont have control over how transformToFormGroup is implemented
        // it would have to be done in a way that returns a partial TForm which right now is not how the method signatures are defined
        const formValue = this.transformToFormGroup(value, {});
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.patchValue(formValue, options);
    }
    reset(value, options = {}) {
        // reset is triggered from parent when formgroup is created
        // then again from sub-form inside ngOnInit after subForm was set
        // so when can safely ignore resets prior to subForm being set
        if (!this.subForm) {
            if (value) {
                this.controlValue = value;
            }
            return;
        }
        const defaultValues = this.getDefaultValues();
        const defaultValuesAsControl = this.transformFromFormGroup(defaultValues);
        // if value is an array skip merging with default values
        if (Array.isArray(value) || Array.isArray(defaultValuesAsControl)) {
            this.controlValue = value;
        }
        else if (
        // in js null is also of type object
        // hence we need to check for null before checking if its of type object
        (value !== null && typeof value === 'object') ||
            (defaultValuesAsControl !== null && typeof defaultValuesAsControl === 'object')) {
            this.controlValue = Object.assign(Object.assign({}, defaultValuesAsControl), value);
        }
        else {
            this.controlValue = (value || defaultValuesAsControl);
        }
        const formValue = this.transformToFormGroup(this.controlValue, defaultValues);
        // TODO figure out how to handle for arrays
        this.subForm.handleFormArrayControls(formValue);
        super.reset(formValue, options);
    }
    getControlValue(control) {
        if (control instanceof SubFormGroup) {
            return control.controlValue;
        }
        else if (control instanceof SubFormArray) {
            return control.controls.map(arrayElementControl => this.getControlValue(arrayElementControl));
        }
        else {
            return control.value;
        }
    }
    updateValue(options) {
        var _a;
        if (!this.subForm) {
            return;
        }
        const controlValue = this._reduceValue();
        this.controlValue = controlValue;
        // eith this is the root sub form or there is no root sub form
        if (((_a = options) === null || _a === void 0 ? void 0 : _a.self) || this.isRoot || !(this.parent instanceof SubFormGroup)) {
            return;
        }
        const parent = this.parent;
        parent.updateValue(options);
        //this.updateValueAndValidity(options);
    }
    _reduceValue() {
        if (!this.subForm) {
            return null;
        }
        const formValue = {};
        for (const [key, value] of Object.entries(this.subForm.formGroup.controls)) {
            const control = value;
            formValue[key] = this.getControlValue(control);
        }
        const controlValue = this.transformFromFormGroup(formValue || {});
        return controlValue;
    }
}
// this idea of this is that when a non sub form group is being updated the sub form group needs to be notifed
function patchFormControl(subFormGroup, control) {
    const patchableControl = control;
    if (!patchableControl.isPatched) {
        const setValue = patchableControl.setValue.bind(patchableControl);
        patchableControl.setValue = (value, options) => {
            setValue(value, options);
            subFormGroup.updateValue(options);
        };
        patchableControl.isPatched = true;
    }
}
class SubFormArray extends FormArray {
    constructor(subForm, controls, validatorOrOpts, asyncValidator) {
        // its important to NOT set validators here as this will trigger calls to value before setSubForm was called
        super(controls);
        this.isRoot = false;
        this._valueChanges = new CustomEventEmitter();
        this.valueChanges = this._valueChanges;
        this.parentValidatorOrOpts = validatorOrOpts;
        this.parentAsyncValidator = asyncValidator;
        this.setSubForm(subForm);
    }
    setSubForm(subForm) {
        this.subForm = subForm;
        this._valueChanges.setSubForm(subForm);
        // for some reason root is not properly set for form array
        // on the other hand form array should never be root anyway so we can ignore thsi for now
        // if (this.root === this) {
        //   this.isRoot = true;
        // }
        // transform to form group should never return null / undefined but {} instead
        this.transformToFormGroup = (obj, defaultValues) => {
            return this.subForm['transformToFormGroup'](obj, defaultValues) || {};
        };
        this.transformFromFormGroup = this.subForm['transformFromFormGroup'].bind(this.subForm);
        this.getDefaultValues = this.subForm['getDefaultValues'].bind(this.subForm);
    }
    setValue(value, options) {
        super.setValue(value, options);
        this.subForm.formGroup.updateValue(options);
    }
    patchValue(value, options) {
        super.patchValue(value, options);
        this.subForm.formGroup.updateValue(options);
    }
    updateValue(options) {
        if (!this.subForm) {
            return;
        }
        this.parent.updateValue(options);
        //this.updateValueAndValidity(options);
    }
    removeAt(index) {
        super.removeAt(index);
        this.subForm.formGroup.updateValue(undefined);
    }
}

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
        return (c) => validator.validate(c);
    }
    else {
        return validator;
    }
}
function normalizeAsyncValidator(validator) {
    // thorws error in latest typescript version
    //if ((<AsyncValidator>validator).validate) {
    if (validator.validate) {
        return (c) => validator.validate(c);
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
    const validator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.validators
        : validatorOrOpts);
    return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
function coerceToAsyncValidator(asyncValidator, validatorOrOpts) {
    const origAsyncValidator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.asyncValidators
        : asyncValidator);
    return Array.isArray(origAsyncValidator) ? composeAsyncValidators(origAsyncValidator) : origAsyncValidator || null;
}

let NgxSubFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormComponent {
    constructor() {
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.emitNullOnDestroy = true;
        this.emitInitialValueOnInit = true;
    }
    get formControlNames() {
        // see @note form-group-undefined for as syntax
        return this.mapControls((_, key) => key, () => true, false);
    }
    ngOnChanges(changes) {
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
        const dataInputHasChanged = changes['dataInput'] !== undefined;
        this._initializeFormGroup(dataInputHasChanged);
    }
    ngAfterContentChecked() {
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
    }
    // is usually called by ngOnChanges
    // but if root form is used without input attributes ngOnChanges might not be called
    // hence if it wasn't called yet it is called from ngOnInit in root form
    _initializeFormGroup(dataInputHasChanged = false) {
        Object.keys(this.formGroup.controls).forEach(key => {
            this.formGroup.removeControl(key);
        });
        const subForm = this.formGroup;
        const controls = this.getFormControls();
        for (const key in controls) {
            if (controls.hasOwnProperty(key)) {
                const control = controls[key];
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
        const options = this.getFormGroupControlOptions();
        const validators = [];
        const asyncValidators = [];
        // get validators that were passed into the sub form group on the parent
        if (subForm.parentValidatorOrOpts) {
            const validator = coerceToValidator(subForm.parentValidatorOrOpts);
            if (validator) {
                validators.push(validator);
            }
        }
        // get async validators that were passed into the sub form group on the parent
        if (subForm.parentAsyncValidator) {
            const validator = coerceToAsyncValidator(subForm.parentAsyncValidator);
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
                const validator = coerceToValidator(options.validators);
                if (validator) {
                    validators.push(validator);
                }
            }
            if (options.asyncValidators) {
                const validator = coerceToAsyncValidator(options.asyncValidators);
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
        const defaultValues = this.getDefaultValues();
        // get default values for reset, if null fallback to undefined as there si a difference when calling reset
        const transformedValue = this.transformFromFormGroup(defaultValues) || undefined;
        let mergedValues;
        // not sure if this case is relevant as arrays are sub forms and would be handled by the other logic below
        const controlValue = (dataInputHasChanged ? this['dataInput'] : subForm.controlValue);
        if (transformedValue && controlValue) {
            if (Array.isArray(controlValue)) {
                mergedValues = controlValue;
            }
            else if (Array.isArray(transformedValue)) {
                mergedValues = transformedValue;
            }
            else {
                mergedValues = Object.assign(Object.assign({}, transformedValue), controlValue);
            }
        }
        else if (transformedValue) {
            mergedValues = transformedValue;
        }
        else {
            mergedValues = controlValue;
        }
        const formValue = this.transformToFormGroup(mergedValues, {});
        this.handleFormArrayControls(formValue);
        // self = false is critical here
        // this allows the parent form to re-evaluate its status after each of its sub form has completed intialization
        // we actually only need to call this on the deepest sub form in a tree (leaves)
        // but there is no way to identify if there are sub forms on the current form + that are also rendered
        // as only when sub forms are rendered the on changes method on the sub form is executed
        // TODO decide if we want to emit an event when input control value != control value after intialization
        // this happens for example when null is passed in but default values change the value of the inner form
        this.formGroup.reset(mergedValues, { onlySelf: false, emitEvent: false });
    }
    mapControls(mapControl, filterControl = () => true, recursiveIfArray = true) {
        if (!this.formGroup) {
            return null;
        }
        const formControls = this.formGroup.controls;
        const controls = {};
        for (const key in formControls) {
            if (this.formGroup.controls.hasOwnProperty(key)) {
                const control = formControls[key];
                if (recursiveIfArray && control instanceof FormArray) {
                    const values = [];
                    for (let i = 0; i < control.length; i++) {
                        if (filterControl(control.at(i), key, true)) {
                            values.push(mapControl(control.at(i), key));
                        }
                    }
                    if (values.length > 0 && values.some(x => !isNullOrUndefined(x))) {
                        controls[key] = values;
                    }
                }
                else if (control && filterControl(control, key, false)) {
                    controls[key] = mapControl(control, key);
                }
            }
        }
        return controls;
    }
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    getFormGroupControlOptions() {
        return {};
    }
    // when getDefaultValues is defined, you do not need to specify the default values
    // in your form (the ones defined within the `getFormControls` method)
    getDefaultValues() {
        return {};
    }
    handleFormArrayControls(obj) {
        // TODO check if this can still happen, it appeared during development. might already be fixed
        if (!this.formGroup) {
            return;
        }
        Object.entries(obj).forEach(([key, value]) => {
            if (this.formGroup.get(key) instanceof FormArray && Array.isArray(value)) {
                const formArray = this.formGroup.get(key);
                // instead of creating a new array every time and push a new FormControl
                // we just remove or add what is necessary so that:
                // - it is as efficient as possible and do not create unnecessary FormControl every time
                // - validators are not destroyed/created again and eventually fire again for no reason
                while (formArray.length > value.length) {
                    formArray.removeAt(formArray.length - 1);
                }
                for (let i = formArray.length; i < value.length; i++) {
                    if (this.formIsFormWithArrayControls()) {
                        formArray.insert(i, this.createFormArrayControl(key, value[i]));
                    }
                    else {
                        const control = new FormControl(value[i]);
                        patchFormControl(this.formGroup, control);
                        formArray.insert(i, control);
                    }
                }
            }
        });
    }
    formIsFormWithArrayControls() {
        return typeof this.createFormArrayControl === 'function';
    }
    // when customizing the emission rate of your sub form component, remember not to **mutate** the stream
    // it is safe to throttle, debounce, delay, etc but using skip, first, last or mutating data inside
    // the stream will cause issues!
    handleEmissionRate() {
        return obs$ => obs$;
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformToFormGroup(obj, defaultValues) {
        // formGroup values can't be null
        return (obj || defaultValues || {});
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformFromFormGroup(formValue) {
        return formValue;
    }
};
__decorate([
    Input('subForm'),
    __metadata("design:type", Object)
], NgxSubFormComponent.prototype, "formGroup", void 0);
NgxSubFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormComponent);
let NgxSubFormRemapComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormRemapComponent extends NgxSubFormComponent {
};
NgxSubFormRemapComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormRemapComponent);

let NgxRootFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxRootFormComponent extends NgxSubFormRemapComponent {
    // change detector only needs to be passed from root form
    // for sub forms the sub-form-directive injects the change detector ref for us
    constructor(cd) {
        super();
        // using a private variable `_dataOutput$` to be able to control the
        // emission rate with a debounce or throttle for ex
        /** @internal */
        this._dataOutput$ = new Subject();
        this.emitInitialValueOnInit = false;
        this.emitNullOnDestroy = false;
        this.dataValue = null;
        this.formGroupInitialized = false;
        this.formGroup = new SubFormGroup({});
        if (cd) {
            this.formGroup.setChangeDetector(cd);
        }
    }
    ngOnInit() {
        if (!this.formGroupInitialized) {
            this._initializeFormGroup();
            this.formGroupInitialized = true;
        }
        this._dataOutput$
            .pipe(takeUntilDestroyed(this), filter(() => this.formGroup.valid), tap(value => this.dataOutput.emit(value)))
            .subscribe();
    }
    ngOnChanges(changes) {
        super.ngOnChanges(changes);
        this.formGroupInitialized = true;
    }
    // needed for take until destroyed
    ngOnDestroy() { }
    /** @internal */
    onRegisterOnChangeHook(data) {
        if (this.formGroup.invalid || isEqual(data, this.dataInput)) {
            return false;
        }
        this.dataValue = data;
        return true;
    }
    transformToFormGroup(obj, defaultValues) {
        return obj;
    }
    transformFromFormGroup(formValue) {
        return formValue;
    }
    manualSave() {
        // if (this.formGroup.valid) {
        //   this.dataValue = this.formGroup.controlValue;
        //   this._dataOutput$.next(this.dataValue);
        // }
        this.dataValue = this.formGroup.controlValue;
        if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
            this._dataOutput$.next(this.dataValue);
        }
    }
};
NgxRootFormComponent.ctorParameters = () => [
    { type: ChangeDetectorRef }
];
NgxRootFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
    ,
    __metadata("design:paramtypes", [ChangeDetectorRef])
], NgxRootFormComponent);

let NgxAutomaticRootFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxAutomaticRootFormComponent extends NgxRootFormComponent {
    constructor(cd) {
        super(cd);
    }
    ngOnInit() {
        super.ngOnInit();
        const status$ = this.formGroup.statusChanges.pipe(startWith(this.formGroup.status));
        const value$ = this.formGroup.valueChanges.pipe(startWith(this.formGroup.value));
        combineLatest([status$, value$])
            .pipe(takeUntilDestroyed(this), filter(([status, value]) => status === 'VALID'), tap(() => this.manualSave()))
            .subscribe();
    }
};
NgxAutomaticRootFormComponent.ctorParameters = () => [
    { type: ChangeDetectorRef }
];
NgxAutomaticRootFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
    ,
    __metadata("design:paramtypes", [ChangeDetectorRef])
], NgxAutomaticRootFormComponent);

let SubFormDirective = class SubFormDirective {
    constructor(cd) {
        this.cd = cd;
    }
    ngOnChanges(changes) {
        if (changes.subForm && this.subForm) {
            this.subForm.setChangeDetector(this.cd);
        }
    }
};
SubFormDirective.ctorParameters = () => [
    { type: ChangeDetectorRef }
];
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

let NgxSubFormModule = class NgxSubFormModule {
};
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

/*
 * Public API Surface of sub-form
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MissingFormControlsError, NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES, NgxAutomaticRootFormComponent, NgxRootFormComponent, NgxSubFormComponent, NgxSubFormModule, NgxSubFormRemapComponent, SubFormArray, SubFormDirective, SubFormGroup, isNullOrUndefined, patchFormControl, subformComponentProviders, takeUntilDestroyed, ɵ0, ɵ1, SUB_FORM_COMPONENT_TOKEN as ɵa };
//# sourceMappingURL=ngx-sub-form.js.map
