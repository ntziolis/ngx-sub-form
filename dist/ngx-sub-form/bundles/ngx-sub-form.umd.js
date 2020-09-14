(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/forms'), require('rxjs'), require('rxjs/operators'), require('fast-deep-equal'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('ngx-sub-form', ['exports', '@angular/core', '@angular/forms', 'rxjs', 'rxjs/operators', 'fast-deep-equal', '@angular/common'], factory) :
    (global = global || self, factory(global['ngx-sub-form'] = {}, global.ng.core, global.ng.forms, global.rxjs, global.rxjs.operators, global.isEqual, global.ng.common));
}(this, (function (exports, core, forms, rxjs, operators, isEqual, common) { 'use strict';

    isEqual = isEqual && isEqual.hasOwnProperty('default') ? isEqual['default'] : isEqual;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __exportStar(m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result.default = mod;
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    // ----------------------------------------------------------------------------------------
    // no need to expose that token out of the lib, do not export that file from public_api.ts!
    // ----------------------------------------------------------------------------------------
    // see https://github.com/angular/angular/issues/8277#issuecomment-263029485
    // this basically allows us to access the host component
    // from a directive without knowing the type of the component at run time
    var SUB_FORM_COMPONENT_TOKEN = new core.InjectionToken('NgxSubFormComponentToken');

    function subformComponentProviders(component) {
        return [
            {
                provide: forms.NG_VALUE_ACCESSOR,
                useExisting: core.forwardRef(function () { return component; }),
                multi: true,
            },
            {
                provide: forms.NG_VALIDATORS,
                useExisting: core.forwardRef(function () { return component; }),
                multi: true,
            },
            {
                provide: SUB_FORM_COMPONENT_TOKEN,
                useExisting: core.forwardRef(function () { return component; }),
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
        return obs.pipe(operators.debounce(function () { return rxjs.timer(time); }));
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
            var onDestroy = new rxjs.Subject();
            var previousOnDestroy = component.ngOnDestroy;
            component.ngOnDestroy = function () {
                if (previousOnDestroy) {
                    previousOnDestroy.apply(component);
                }
                onDestroy.next();
                onDestroy.complete();
            };
            return source.pipe(operators.takeUntil(onDestroy));
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
    }(core.EventEmitter));
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
            // this method is being called from angular code only with value of _reduceValue() which returns the current controlValue
            set: function (value) {
                if (!this.subForm) {
                    return;
                }
                var controlValue = value; //this.transformFromFormGroup((value as unknown) as TForm) as TControl;
                this.controlValue = controlValue;
                // @ts-ignore
                _super.prototype.value = controlValue;
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
    }(forms.FormGroup));
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
    }(forms.FormArray));

    // The following code is copied from angular source since those methods tehy are not exported
    // https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/directives/shared.ts
    function composeValidators(validators) {
        return validators != null ? forms.Validators.compose(validators.map(normalizeValidator)) : null;
    }
    function composeAsyncValidators(validators) {
        return validators != null ? forms.Validators.composeAsync(validators.map(normalizeAsyncValidator)) : null;
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
                    if (control instanceof forms.FormControl) {
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
                if (Array.isArray(controlValue)) {
                    mergedValues = controlValue;
                }
                else if (Array.isArray(transformedValue)) {
                    mergedValues = transformedValue;
                }
                else {
                    mergedValues = __assign(__assign({}, transformedValue), controlValue);
                }
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
                    if (recursiveIfArray && control instanceof forms.FormArray) {
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
                if (_this.formGroup.get(key) instanceof forms.FormArray && Array.isArray(value)) {
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
                            var control = new forms.FormControl(value[i]);
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
            core.Input('subForm'),
            __metadata("design:type", Object)
        ], NgxSubFormComponent.prototype, "formGroup", void 0);
        NgxSubFormComponent = __decorate([
            core.Directive()
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
            core.Directive()
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
            _this._dataOutput$ = new rxjs.Subject();
            _this.emitInitialValueOnInit = false;
            _this.emitNullOnDestroy = false;
            _this.dataValue = null;
            _this.formGroupInitialized = false;
            _this.formGroup = new SubFormGroup({});
            if (cd) {
                _this.formGroup.setChangeDetector(cd);
            }
            return _this;
        }
        NgxRootFormComponent.prototype.ngOnInit = function () {
            var _this = this;
            if (!this.formGroupInitialized) {
                this._initializeFormGroup();
                this.formGroupInitialized = true;
            }
            this._dataOutput$
                .pipe(takeUntilDestroyed(this), operators.filter(function () { return _this.formGroup.valid; }), operators.tap(function (value) { return _this.dataOutput.emit(value); }))
                .subscribe();
        };
        NgxRootFormComponent.prototype.ngOnChanges = function (changes) {
            _super.prototype.ngOnChanges.call(this, changes);
            this.formGroupInitialized = true;
        };
        // needed for take until destroyed
        NgxRootFormComponent.prototype.ngOnDestroy = function () { };
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
            { type: core.ChangeDetectorRef }
        ]; };
        NgxRootFormComponent = __decorate([
            core.Directive()
            // tslint:disable-next-line: directive-class-suffix
            ,
            __metadata("design:paramtypes", [core.ChangeDetectorRef])
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
            var status$ = this.formGroup.statusChanges.pipe(operators.startWith(this.formGroup.status));
            var value$ = this.formGroup.valueChanges.pipe(operators.startWith(this.formGroup.value));
            rxjs.combineLatest([status$, value$])
                .pipe(takeUntilDestroyed(this), operators.filter(function (_a) {
                var _b = __read(_a, 2), status = _b[0], value = _b[1];
                return status === 'VALID';
            }), operators.tap(function () { return _this.manualSave(); }))
                .subscribe();
        };
        NgxAutomaticRootFormComponent.ctorParameters = function () { return [
            { type: core.ChangeDetectorRef }
        ]; };
        NgxAutomaticRootFormComponent = __decorate([
            core.Directive()
            // tslint:disable-next-line: directive-class-suffix
            ,
            __metadata("design:paramtypes", [core.ChangeDetectorRef])
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
            { type: core.ChangeDetectorRef }
        ]; };
        __decorate([
            core.Input(),
            __metadata("design:type", SubFormGroup)
        ], SubFormDirective.prototype, "subForm", void 0);
        SubFormDirective = __decorate([
            core.Directive({
                selector: '[subForm]',
            }),
            __metadata("design:paramtypes", [core.ChangeDetectorRef])
        ], SubFormDirective);
        return SubFormDirective;
    }());

    var NgxSubFormModule = /** @class */ (function () {
        function NgxSubFormModule() {
        }
        NgxSubFormModule = __decorate([
            core.NgModule({
                declarations: [
                    SubFormDirective
                ],
                imports: [
                    common.CommonModule,
                ],
                exports: [
                    SubFormDirective
                ]
            })
        ], NgxSubFormModule);
        return NgxSubFormModule;
    }());

    exports.MissingFormControlsError = MissingFormControlsError;
    exports.NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES = NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES;
    exports.NgxAutomaticRootFormComponent = NgxAutomaticRootFormComponent;
    exports.NgxRootFormComponent = NgxRootFormComponent;
    exports.NgxSubFormComponent = NgxSubFormComponent;
    exports.NgxSubFormModule = NgxSubFormModule;
    exports.NgxSubFormRemapComponent = NgxSubFormRemapComponent;
    exports.SubFormArray = SubFormArray;
    exports.SubFormDirective = SubFormDirective;
    exports.SubFormGroup = SubFormGroup;
    exports.isNullOrUndefined = isNullOrUndefined;
    exports.patchFormControl = patchFormControl;
    exports.subformComponentProviders = subformComponentProviders;
    exports.takeUntilDestroyed = takeUntilDestroyed;
    exports.ɵ0 = ɵ0;
    exports.ɵ1 = ɵ1;
    exports.ɵa = SUB_FORM_COMPONENT_TOKEN;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-sub-form.umd.js.map
