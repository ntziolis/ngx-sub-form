(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/forms'), require('@angular/core'), require('rxjs'), require('rxjs/operators'), require('fast-deep-equal')) :
    typeof define === 'function' && define.amd ? define('ngx-sub-form', ['exports', '@angular/forms', '@angular/core', 'rxjs', 'rxjs/operators', 'fast-deep-equal'], factory) :
    (global = global || self, factory(global['ngx-sub-form'] = {}, global.ng.forms, global.ng.core, global.rxjs, global.rxjs.operators, global.isEqual));
}(this, (function (exports, forms, core, rxjs, operators, isEqual) { 'use strict';

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

    var NgxSubFormComponent = /** @class */ (function () {
        function NgxSubFormComponent() {
            var _this = this;
            this.controlKeys = [];
            // when developing the lib it's a good idea to set the formGroup type
            // to current + `| undefined` to catch a bunch of possible issues
            // see @note form-group-undefined
            this.formGroup = new forms.FormGroup(this._getFormControls(), this.getFormGroupControlOptions());
            this.onChange = undefined;
            this.onTouched = undefined;
            this.emitNullOnDestroy = true;
            this.emitInitialValueOnInit = true;
            this.subscription = undefined;
            // a RootFormComponent with the disabled property set initially to `false`
            // will call `setDisabledState` *before* the form is actually available
            // and it wouldn't be disabled once available, therefore we use this flag
            // to check when the FormGroup is created if we should disable it
            this.controlDisabled = false;
            // if the form has default values, they should be applied straight away
            var defaultValues = this.getDefaultValues();
            if (!!defaultValues) {
                this.formGroup.reset(defaultValues, { emitEvent: false });
            }
            // `setTimeout` and `updateValueAndValidity` are both required here
            // indeed, if you check the demo you'll notice that without it, if
            // you select `Droid` and `Assassin` for example the displayed errors
            // are not yet defined for the field `assassinDroid`
            // (until you change one of the value in that form)
            setTimeout(function () {
                if (_this.formGroup) {
                    _this.formGroup.updateValueAndValidity({ emitEvent: false });
                    if (_this.controlDisabled) {
                        _this.formGroup.disable();
                    }
                }
            }, 0);
        }
        Object.defineProperty(NgxSubFormComponent.prototype, "formGroupControls", {
            get: function () {
                // @note form-group-undefined we need the return null here because we do not want to expose the fact that
                // the form can be undefined, it's handled internally to contain an Angular bug
                if (!this.formGroup) {
                    return null;
                }
                return this.formGroup.controls;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NgxSubFormComponent.prototype, "formGroupValues", {
            get: function () {
                // see @note form-group-undefined for non-null assertion reason
                // tslint:disable-next-line:no-non-null-assertion
                return this.mapControls(function (ctrl) { return ctrl.value; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NgxSubFormComponent.prototype, "formGroupErrors", {
            get: function () {
                var errors = this.mapControls(function (ctrl) { return ctrl.errors; }, function (ctrl, _, isCtrlWithinFormArray) { return (isCtrlWithinFormArray ? true : ctrl.invalid); }, true);
                if (!this.formGroup.errors && (!errors || !Object.keys(errors).length)) {
                    return null;
                }
                return Object.assign({}, this.formGroup.errors ? { formGroup: this.formGroup.errors } : {}, errors);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NgxSubFormComponent.prototype, "formControlNames", {
            get: function () {
                // see @note form-group-undefined for as syntax
                return this.mapControls(function (_, key) { return key; }, function () { return true; }, false);
            },
            enumerable: true,
            configurable: true
        });
        NgxSubFormComponent.prototype._getFormControls = function () {
            var controls = this.getFormControls();
            this.controlKeys = Object.keys(controls);
            return controls;
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
        NgxSubFormComponent.prototype.onFormUpdate = function (formUpdate) { };
        /**
         * Extend this method to provide custom local FormGroup level validation
         */
        NgxSubFormComponent.prototype.getFormGroupControlOptions = function () {
            return {};
        };
        NgxSubFormComponent.prototype.validate = function () {
            if (
            // @hack see where defining this.formGroup to undefined
            !this.formGroup ||
                this.formGroup.valid) {
                return null;
            }
            return this.formGroupErrors;
        };
        // @todo could this be removed to avoid an override and just use `takeUntilDestroyed`?
        NgxSubFormComponent.prototype.ngOnDestroy = function () {
            // @hack there's a memory leak within Angular and those components
            // are not correctly cleaned up which leads to error if a form is defined
            // with validators and then it's been removed, the validator would still fail
            // `as any` if because we do not want to define the formGroup as FormGroup | undefined
            // everything related to undefined is handled internally and shouldn't be exposed to end user
            this.formGroup = undefined;
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            if (this.emitNullOnDestroy && this.onChange) {
                this.onChange(null);
            }
            this.onChange = undefined;
        };
        // when getDefaultValues is defined, you do not need to specify the default values
        // in your form (the ones defined within the `getFormControls` method)
        NgxSubFormComponent.prototype.getDefaultValues = function () {
            return null;
        };
        NgxSubFormComponent.prototype.writeValue = function (obj) {
            // @hack see where defining this.formGroup to undefined
            if (!this.formGroup) {
                return;
            }
            var defaultValues = this.getDefaultValues();
            var transformedValue = this.transformToFormGroup(obj === undefined ? null : obj, defaultValues);
            if (isNullOrUndefined(transformedValue)) {
                this.formGroup.reset(
                // calling `reset` on a form with `null` throws an error but if nothing is passed
                // (undefined) it will reset all the form values to null (as expected)
                defaultValues === null ? undefined : defaultValues, 
                // emit to keep internal and external information about data in of control in sync, when
                // null/undefined was passed into writeValue
                // while internally being replaced with defaultValues
                { emitEvent: isNullOrUndefined(obj) && !isNullOrUndefined(defaultValues) });
            }
            else {
                var missingKeys = this.getMissingKeys(transformedValue);
                if (missingKeys.length > 0) {
                    throw new MissingFormControlsError(missingKeys);
                }
                this.handleFormArrayControls(transformedValue);
                // The next few lines are weird but it's as workaround.
                // There are some shady behavior with the disabled state
                // of a form. Apparently, using `setValue` on a disabled
                // form does re-enable it *sometimes*, not always.
                // related issues:
                // https://github.com/angular/angular/issues/31506
                // https://github.com/angular/angular/issues/22556
                // but if you display `this.formGroup.disabled`
                // before and after the `setValue` is called, it's the same
                // result which is even weirder
                var fgDisabled = this.formGroup.disabled;
                this.formGroup.setValue(transformedValue, {
                    // emit to keep internal and external information about data in of control in sync, when
                    // null/undefined was passed into writeValue
                    // while internally being replaced with transformedValue
                    emitEvent: isNullOrUndefined(obj),
                });
                if (fgDisabled) {
                    this.formGroup.disable();
                }
            }
            this.formGroup.markAsPristine();
            this.formGroup.markAsUntouched();
        };
        NgxSubFormComponent.prototype.handleFormArrayControls = function (obj) {
            var _this = this;
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
                            formArray.insert(i, new forms.FormControl(value[i]));
                        }
                    }
                }
            });
        };
        NgxSubFormComponent.prototype.formIsFormWithArrayControls = function () {
            return typeof this.createFormArrayControl === 'function';
        };
        NgxSubFormComponent.prototype.getMissingKeys = function (transformedValue) {
            // `controlKeys` can be an empty array, empty forms are allowed
            var missingKeys = this.controlKeys.reduce(function (keys, key) {
                if (isNullOrUndefined(transformedValue) || transformedValue[key] === undefined) {
                    keys.push(key);
                }
                return keys;
            }, []);
            return missingKeys;
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
        NgxSubFormComponent.prototype.registerOnChange = function (fn) {
            var _this = this;
            if (!this.formGroup) {
                return;
            }
            this.onChange = fn;
            var formControlNames = Object.keys(this.formControlNames);
            var formValues = formControlNames.map(function (key) {
                return _this.formGroup.controls[key].valueChanges.pipe(operators.startWith(_this.formGroup.controls[key].value), operators.map(function (value) { return ({ key: key, value: value }); }));
            });
            var lastKeyEmitted$ = rxjs.merge.apply(void 0, __spread(formValues.map(function (obs) { return obs.pipe(operators.map(function (x) { return x.key; })); })));
            this.subscription = this.formGroup.valueChanges
                .pipe(
            // hook to give access to the observable for sub-classes
            // this allow sub-classes (for example) to debounce, throttle, etc
            this.handleEmissionRate(), operators.startWith(this.formGroup.value), 
            // this is required otherwise an `ExpressionChangedAfterItHasBeenCheckedError` will happen
            // this is due to the fact that parent component will define a given state for the form that might
            // be changed once the children are being initialized
            operators.delay(0), operators.filter(function () { return !!_this.formGroup; }), 
            // detect which stream emitted last
            operators.withLatestFrom(lastKeyEmitted$), operators.map(function (_a, index) {
                var _b = __read(_a, 2), _ = _b[0], keyLastEmit = _b[1];
                if (index > 0 && _this.onTouched) {
                    _this.onTouched();
                }
                if (index > 0 || (index === 0 && _this.emitInitialValueOnInit)) {
                    if (_this.onChange) {
                        _this.onChange(_this.transformFromFormGroup(
                        // do not use the changes passed by `this.formGroup.valueChanges` here
                        // as we've got a delay(0) above, on the next tick the form data might
                        // be outdated and might result into an inconsistent state where a form
                        // state is valid (base on latest value) but the previous value
                        // (the one passed by `this.formGroup.valueChanges` would be the previous one)
                        _this.formGroup.value));
                    }
                    var formUpdate = {};
                    formUpdate[keyLastEmit] = true;
                    _this.onFormUpdate(formUpdate);
                }
            }))
                .subscribe();
        };
        NgxSubFormComponent.prototype.registerOnTouched = function (fn) {
            this.onTouched = fn;
        };
        NgxSubFormComponent.prototype.setDisabledState = function (shouldDisable) {
            this.controlDisabled = !!shouldDisable;
            if (!this.formGroup) {
                return;
            }
            if (shouldDisable) {
                this.formGroup.disable({ emitEvent: false });
            }
            else {
                this.formGroup.enable({ emitEvent: false });
            }
        };
        NgxSubFormComponent = __decorate([
            core.Directive()
            // tslint:disable-next-line: directive-class-suffix
            ,
            __metadata("design:paramtypes", [])
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
        // tslint:disable-next-line: directive-class-suffix
        function NgxRootFormComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            // `Input` values are set while the `ngOnChanges` hook is ran
            // and it does happen before the `ngOnInit` where we start
            // listening to `dataInput$`. Therefore, it cannot be a `Subject`
            // or we will miss the first value
            _this.dataInput$ = new rxjs.BehaviorSubject(null);
            // using a private variable `_dataOutput$` to be able to control the
            // emission rate with a debounce or throttle for ex
            /** @internal */
            _this._dataOutput$ = new rxjs.Subject();
            _this.emitInitialValueOnInit = false;
            _this.emitNullOnDestroy = false;
            _this.dataValue = null;
            return _this;
        }
        Object.defineProperty(NgxRootFormComponent.prototype, "disabled", {
            set: function (shouldDisable) {
                this.setDisabledState(shouldDisable);
            },
            enumerable: true,
            configurable: true
        });
        NgxRootFormComponent.prototype.ngOnInit = function () {
            var _this = this;
            // we need to manually call registerOnChange because that function
            // handles most of the logic from NgxSubForm and when it's called
            // as a ControlValueAccessor that function is called by Angular itself
            this.registerOnChange(function (data) { return _this.onRegisterOnChangeHook(data); });
            this.dataInput$
                .pipe(operators.filter(function (newValue) { return !isEqual(newValue, _this.formGroup.value); }), operators.tap(function (newValue) {
                if (!isNullOrUndefined(newValue)) {
                    _this.writeValue(newValue);
                }
            }), takeUntilDestroyed(this))
                .subscribe();
            this._dataOutput$
                .pipe(operators.filter(function () { return _this.formGroup.valid; }), operators.tap(function (value) { return _this.dataOutput.emit(value); }), takeUntilDestroyed(this))
                .subscribe();
        };
        /** @internal */
        NgxRootFormComponent.prototype.onRegisterOnChangeHook = function (data) {
            if (this.formGroup.invalid || isEqual(data, this.dataInput$.value)) {
                return false;
            }
            this.dataValue = data;
            return true;
        };
        // called by the DataInput decorator
        /** @internal */
        NgxRootFormComponent.prototype.dataInputUpdated = function (data) {
            this.dataInput$.next(data);
        };
        NgxRootFormComponent.prototype.writeValue = function (obj) {
            this.dataValue = obj;
            _super.prototype.writeValue.call(this, obj);
        };
        NgxRootFormComponent.prototype.transformToFormGroup = function (obj, defaultValues) {
            return obj;
        };
        NgxRootFormComponent.prototype.transformFromFormGroup = function (formValue) {
            return formValue;
        };
        NgxRootFormComponent.prototype.manualSave = function () {
            if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
                this._dataOutput$.next(this.dataValue);
            }
        };
        __decorate([
            core.Input(),
            __metadata("design:type", Object),
            __metadata("design:paramtypes", [Object])
        ], NgxRootFormComponent.prototype, "disabled", null);
        NgxRootFormComponent = __decorate([
            core.Directive()
            // tslint:disable-next-line: directive-class-suffix
        ], NgxRootFormComponent);
        return NgxRootFormComponent;
    }(NgxSubFormRemapComponent));

    var NgxAutomaticRootFormComponent = /** @class */ (function (_super) {
        __extends(NgxAutomaticRootFormComponent, _super);
        // tslint:disable-next-line: directive-class-suffix
        function NgxAutomaticRootFormComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /** @internal */
        NgxAutomaticRootFormComponent.prototype.onRegisterOnChangeHook = function (data) {
            if (!_super.prototype.onRegisterOnChangeHook.call(this, data)) {
                return false;
            }
            if (this.formGroup) {
                this.formGroup.markAsPristine();
                if (this.formGroup.valid) {
                    this.manualSave();
                }
            }
            return true;
        };
        NgxAutomaticRootFormComponent = __decorate([
            core.Directive()
            // tslint:disable-next-line: directive-class-suffix
        ], NgxAutomaticRootFormComponent);
        return NgxAutomaticRootFormComponent;
    }(NgxRootFormComponent));

    var DataInputUsedOnWrongPropertyError = /** @class */ (function (_super) {
        __extends(DataInputUsedOnWrongPropertyError, _super);
        function DataInputUsedOnWrongPropertyError(calledOnPropertyKey) {
            return _super.call(this, "You're trying to apply the \"DataInput\" decorator on a property called \"" + calledOnPropertyKey + "\". That decorator should only be used on a property called \"dataInput\"") || this;
        }
        return DataInputUsedOnWrongPropertyError;
    }(Error));
    function DataInput() {
        return function (target, propertyKey) {
            if (propertyKey !== 'dataInput') {
                throw new DataInputUsedOnWrongPropertyError(propertyKey);
            }
            Object.defineProperty(target, propertyKey, {
                set: function (dataInputValue) {
                    this.dataInputUpdated(dataInputValue);
                },
            });
        };
    }

    exports.DataInput = DataInput;
    exports.DataInputUsedOnWrongPropertyError = DataInputUsedOnWrongPropertyError;
    exports.MissingFormControlsError = MissingFormControlsError;
    exports.NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES = NGX_SUB_FORM_HANDLE_VALUE_CHANGES_RATE_STRATEGIES;
    exports.NgxAutomaticRootFormComponent = NgxAutomaticRootFormComponent;
    exports.NgxRootFormComponent = NgxRootFormComponent;
    exports.NgxSubFormComponent = NgxSubFormComponent;
    exports.NgxSubFormRemapComponent = NgxSubFormRemapComponent;
    exports.isNullOrUndefined = isNullOrUndefined;
    exports.subformComponentProviders = subformComponentProviders;
    exports.takeUntilDestroyed = takeUntilDestroyed;
    exports.ɵ0 = ɵ0;
    exports.ɵ1 = ɵ1;
    exports.ɵa = SUB_FORM_COMPONENT_TOKEN;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-sub-form.umd.js.map
