import { __decorate, __extends, __metadata, __read, __spread } from "tslib";
import { Directive } from '@angular/core';
import { FormGroup, FormArray, FormControl, } from '@angular/forms';
import { merge } from 'rxjs';
import { delay, filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import { MissingFormControlsError, isNullOrUndefined, } from './ngx-sub-form-utils';
var NgxSubFormComponent = /** @class */ (function () {
    function NgxSubFormComponent() {
        var _this = this;
        this.controlKeys = [];
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.formGroup = new FormGroup(this._getFormControls(), this.getFormGroupControlOptions());
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
                        formArray.insert(i, new FormControl(value[i]));
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
            return _this.formGroup.controls[key].valueChanges.pipe(startWith(_this.formGroup.controls[key].value), map(function (value) { return ({ key: key, value: value }); }));
        });
        var lastKeyEmitted$ = merge.apply(void 0, __spread(formValues.map(function (obs) { return obs.pipe(map(function (x) { return x.key; })); })));
        this.subscription = this.formGroup.valueChanges
            .pipe(
        // hook to give access to the observable for sub-classes
        // this allow sub-classes (for example) to debounce, throttle, etc
        this.handleEmissionRate(), startWith(this.formGroup.value), 
        // this is required otherwise an `ExpressionChangedAfterItHasBeenCheckedError` will happen
        // this is due to the fact that parent component will define a given state for the form that might
        // be changed once the children are being initialized
        delay(0), filter(function () { return !!_this.formGroup; }), 
        // detect which stream emitted last
        withLatestFrom(lastKeyEmitted$), map(function (_a, index) {
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
        Directive()
        // tslint:disable-next-line: directive-class-suffix
        ,
        __metadata("design:paramtypes", [])
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQWEsU0FBUyxFQUFhLE1BQU0sZUFBZSxDQUFDO0FBQ2hFLE9BQU8sRUFJTCxTQUFTLEVBR1QsU0FBUyxFQUNULFdBQVcsR0FDWixNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBRSxLQUFLLEVBQTRCLE1BQU0sTUFBTSxDQUFDO0FBQ3ZELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0UsT0FBTyxFQUtMLHdCQUF3QixFQUV4QixpQkFBaUIsR0FLbEIsTUFBTSxzQkFBc0IsQ0FBQztBQWU5QjtJQWdFRTtRQUFBLGlCQXFCQztRQTVDTyxnQkFBVyxHQUE0QixFQUFFLENBQUM7UUFFbEQscUVBQXFFO1FBQ3JFLGlFQUFpRTtRQUNqRSxpQ0FBaUM7UUFDMUIsY0FBUyxHQUFtQyxJQUFJLFNBQVMsQ0FDOUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQ3ZCLElBQUksQ0FBQywwQkFBMEIsRUFBNEIsQ0FDZixDQUFDO1FBRXJDLGFBQVEsR0FBeUIsU0FBUyxDQUFDO1FBQzNDLGNBQVMsR0FBeUIsU0FBUyxDQUFDO1FBQzVDLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFFaEMsaUJBQVksR0FBNkIsU0FBUyxDQUFDO1FBRTNELDBFQUEwRTtRQUMxRSx1RUFBdUU7UUFDdkUseUVBQXlFO1FBQ3pFLGlFQUFpRTtRQUN6RCxvQkFBZSxHQUFHLEtBQUssQ0FBQztRQUc5Qix1RUFBdUU7UUFDdkUsSUFBTSxhQUFhLEdBQWtDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFD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LENBQUMsQ0FBQyxhQUFhLENBQUM7UUFFdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbkIsT0FBTztTQUNSO1FBRUQsSUFBSSxhQUFhLEVBQUU7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUM3QztJQUNILENBQUM7SUF4WW1CLG1CQUFtQjtRQUZ4QyxTQUFTLEVBQUU7UUFDWixtREFBbUQ7OztPQUM3QixtQkFBbUIsQ0F5WXhDO0lBQUQsMEJBQUM7Q0FBQSxBQXpZRCxJQXlZQztTQXpZcUIsbUJBQW1CO0FBNll6QztJQUF3Riw0Q0FHdkY7SUFKRCxtREFBbUQ7SUFDbkQ7O0lBU0EsQ0FBQztJQVRxQix3QkFBd0I7UUFGN0MsU0FBUyxFQUFFO1FBQ1osbURBQW1EO09BQzdCLHdCQUF3QixDQVM3QztJQUFELCtCQUFDO0NBQUEsQUFURCxDQUF3RixtQkFBbUIsR0FTMUc7U0FUcUIsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT25EZXN0cm95LCBEaXJlY3RpdmUsIENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0Q29udHJvbCxcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIENvbnRyb2xWYWx1ZUFjY2Vzc29yLFxyXG4gIEZvcm1Hcm91cCxcclxuICBWYWxpZGF0aW9uRXJyb3JzLFxyXG4gIFZhbGlkYXRvcixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBtZXJnZSwgT2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IGRlbGF5LCBmaWx0ZXIsIG1hcCwgc3RhcnRXaXRoLCB3aXRoTGF0ZXN0RnJvbSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHtcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgRm9ybVVwZGF0ZSxcclxuICBNaXNzaW5nRm9ybUNvbnRyb2xzRXJyb3IsXHJcbiAgRm9ybUVycm9ycyxcclxuICBpc051bGxPclVuZGVmaW5lZCxcclxuICBDb250cm9sc1R5cGUsXHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBUeXBlZEFic3RyYWN0Q29udHJvbCxcclxuICBUeXBlZEZvcm1Hcm91cCxcclxufSBmcm9tICcuL25neC1zdWItZm9ybS11dGlscyc7XHJcbmltcG9ydCB7IEZvcm1Hcm91cE9wdGlvbnMsIE5neEZvcm1XaXRoQXJyYXlDb250cm9scywgT25Gb3JtVXBkYXRlIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0udHlwZXMnO1xyXG5cclxudHlwZSBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+ID0gKFxyXG4gIGN0cmw6IFR5cGVkQWJzdHJhY3RDb250cm9sPGFueT4sXHJcbiAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlLFxyXG4pID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBDb250cm9sVmFsdWVBY2Nlc3NvciwgVmFsaWRhdG9yLCBPbkRlc3Ryb3ksIE9uRm9ybVVwZGF0ZTxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgcHVibGljIGdldCBmb3JtR3JvdXBDb250cm9scygpOiBDb250cm9sc1R5cGU8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgd2UgbmVlZCB0aGUgcmV0dXJuIG51bGwgaGVyZSBiZWNhdXNlIHdlIGRvIG5vdCB3YW50IHRvIGV4cG9zZSB0aGUgZmFjdCB0aGF0XHJcbiAgICAvLyB0aGUgZm9ybSBjYW4gYmUgdW5kZWZpbmVkLCBpdCdzIGhhbmRsZWQgaW50ZXJuYWxseSB0byBjb250YWluIGFuIEFuZ3VsYXIgYnVnXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsIGFzIGFueTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzIGFzIHVua25vd24pIGFzIENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9ybUdyb3VwVmFsdWVzKCk6IFJlcXVpcmVkPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZCBmb3Igbm9uLW51bGwgYXNzZXJ0aW9uIHJlYXNvblxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLW5vbi1udWxsLWFzc2VydGlvblxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoY3RybCA9PiBjdHJsLnZhbHVlKSE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Hcm91cEVycm9ycygpOiBGb3JtRXJyb3JzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIGNvbnN0IGVycm9yczogRm9ybUVycm9yczxGb3JtSW50ZXJmYWNlPiA9IHRoaXMubWFwQ29udHJvbHM8VmFsaWRhdGlvbkVycm9ycyB8IFZhbGlkYXRpb25FcnJvcnNbXSB8IG51bGw+KFxyXG4gICAgICBjdHJsID0+IGN0cmwuZXJyb3JzLFxyXG4gICAgICAoY3RybCwgXywgaXNDdHJsV2l0aGluRm9ybUFycmF5KSA9PiAoaXNDdHJsV2l0aGluRm9ybUFycmF5ID8gdHJ1ZSA6IGN0cmwuaW52YWxpZCksXHJcbiAgICAgIHRydWUsXHJcbiAgICApIGFzIEZvcm1FcnJvcnM8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cC5lcnJvcnMgJiYgKCFlcnJvcnMgfHwgIU9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoKSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5mb3JtR3JvdXAuZXJyb3JzID8geyBmb3JtR3JvdXA6IHRoaXMuZm9ybUdyb3VwLmVycm9ycyB9IDoge30sIGVycm9ycyk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNvbnRyb2xLZXlzOiAoa2V5b2YgRm9ybUludGVyZmFjZSlbXSA9IFtdO1xyXG5cclxuICAvLyB3aGVuIGRldmVsb3BpbmcgdGhlIGxpYiBpdCdzIGEgZ29vZCBpZGVhIHRvIHNldCB0aGUgZm9ybUdyb3VwIHR5cGVcclxuICAvLyB0byBjdXJyZW50ICsgYHwgdW5kZWZpbmVkYCB0byBjYXRjaCBhIGJ1bmNoIG9mIHBvc3NpYmxlIGlzc3Vlc1xyXG4gIC8vIHNlZSBAbm90ZSBmb3JtLWdyb3VwLXVuZGVmaW5lZFxyXG4gIHB1YmxpYyBmb3JtR3JvdXA6IFR5cGVkRm9ybUdyb3VwPEZvcm1JbnRlcmZhY2U+ID0gKG5ldyBGb3JtR3JvdXAoXHJcbiAgICB0aGlzLl9nZXRGb3JtQ29udHJvbHMoKSxcclxuICAgIHRoaXMuZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKSBhcyBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gICkgYXMgdW5rbm93bikgYXMgVHlwZWRGb3JtR3JvdXA8Rm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBvbkNoYW5nZTogRnVuY3Rpb24gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcbiAgcHJvdGVjdGVkIG9uVG91Y2hlZDogRnVuY3Rpb24gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcbiAgcHJvdGVjdGVkIGVtaXROdWxsT25EZXN0cm95ID0gdHJ1ZTtcclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IHRydWU7XHJcblxyXG4gIHByaXZhdGUgc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gIC8vIGEgUm9vdEZvcm1Db21wb25lbnQgd2l0aCB0aGUgZGlzYWJsZWQgcHJvcGVydHkgc2V0IGluaXRpYWxseSB0byBgZmFsc2VgXHJcbiAgLy8gd2lsbCBjYWxsIGBzZXREaXNhYmxlZFN0YXRlYCAqYmVmb3JlKiB0aGUgZm9ybSBpcyBhY3R1YWxseSBhdmFpbGFibGVcclxuICAvLyBhbmQgaXQgd291bGRuJ3QgYmUgZGlzYWJsZWQgb25jZSBhdmFpbGFibGUsIHRoZXJlZm9yZSB3ZSB1c2UgdGhpcyBmbGFnXHJcbiAgLy8gdG8gY2hlY2sgd2hlbiB0aGUgRm9ybUdyb3VwIGlzIGNyZWF0ZWQgaWYgd2Ugc2hvdWxkIGRpc2FibGUgaXRcclxuICBwcml2YXRlIGNvbnRyb2xEaXNhYmxlZCA9IGZhbHNlO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG4gICAgaWYgKCEhZGVmYXVsdFZhbHVlcykge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZXNldChkZWZhdWx0VmFsdWVzLCB7IGVtaXRFdmVudDogZmFsc2UgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYHNldFRpbWVvdXRgIGFuZCBgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eWAgYXJlIGJvdGggcmVxdWlyZWQgaGVyZVxyXG4gICAgLy8gaW5kZWVkLCBpZiB5b3UgY2hlY2sgdGhlIGRlbW8geW91J2xsIG5vdGljZSB0aGF0IHdpdGhvdXQgaXQsIGlmXHJcbiAgICAvLyB5b3Ugc2VsZWN0IGBEcm9pZGAgYW5kIGBBc3Nhc3NpbmAgZm9yIGV4YW1wbGUgdGhlIGRpc3BsYXllZCBlcnJvcnNcclxuICAgIC8vIGFyZSBub3QgeWV0IGRlZmluZWQgZm9yIHRoZSBmaWVsZCBgYXNzYXNzaW5Ecm9pZGBcclxuICAgIC8vICh1bnRpbCB5b3UgY2hhbmdlIG9uZSBvZiB0aGUgdmFsdWUgaW4gdGhhdCBmb3JtKVxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoeyBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb250cm9sRGlzYWJsZWQpIHtcclxuICAgICAgICAgIHRoaXMuZm9ybUdyb3VwLmRpc2FibGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sIDApO1xyXG4gIH1cclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG4gIHByaXZhdGUgX2dldEZvcm1Db250cm9scygpOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICBjb25zdCBjb250cm9sczogQ29udHJvbHM8Rm9ybUludGVyZmFjZT4gPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG5cclxuICAgIHRoaXMuY29udHJvbEtleXMgPSAoT2JqZWN0LmtleXMoY29udHJvbHMpIGFzIHVua25vd24pIGFzIChrZXlvZiBGb3JtSW50ZXJmYWNlKVtdO1xyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPixcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4sXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgKTogQ29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoKSA9PiB0cnVlLFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbiA9IHRydWUsXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sczogQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbHM7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHM6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGZvcm1Db250cm9scykge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtQ29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZUlmQXJyYXkgJiYgY29udHJvbCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgICAgICAgY29uc3QgdmFsdWVzOiBNYXBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZXMucHVzaChtYXBDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwICYmIHZhbHVlcy5zb21lKHggPT4gIWlzTnVsbE9yVW5kZWZpbmVkKHgpKSkge1xyXG4gICAgICAgICAgICBjb250cm9sc1trZXldID0gdmFsdWVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY29udHJvbCAmJiBmaWx0ZXJDb250cm9sKGNvbnRyb2wsIGtleSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICBjb250cm9sc1trZXldID0gbWFwQ29udHJvbChjb250cm9sLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvbkZvcm1VcGRhdGUoZm9ybVVwZGF0ZTogRm9ybVVwZGF0ZTxGb3JtSW50ZXJmYWNlPik6IHZvaWQge31cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0ZW5kIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgY3VzdG9tIGxvY2FsIEZvcm1Hcm91cCBsZXZlbCB2YWxpZGF0aW9uXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCk6IEZvcm1Hcm91cE9wdGlvbnM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHZhbGlkYXRlKCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsIHtcclxuICAgIGlmIChcclxuICAgICAgLy8gQGhhY2sgc2VlIHdoZXJlIGRlZmluaW5nIHRoaXMuZm9ybUdyb3VwIHRvIHVuZGVmaW5lZFxyXG4gICAgICAhdGhpcy5mb3JtR3JvdXAgfHxcclxuICAgICAgdGhpcy5mb3JtR3JvdXAudmFsaWRcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5mb3JtR3JvdXBFcnJvcnM7XHJcbiAgfVxyXG5cclxuICAvLyBAdG9kbyBjb3VsZCB0aGlzIGJlIHJlbW92ZWQgdG8gYXZvaWQgYW4gb3ZlcnJpZGUgYW5kIGp1c3QgdXNlIGB0YWtlVW50aWxEZXN0cm95ZWRgP1xyXG4gIHB1YmxpYyBuZ09uRGVzdHJveSgpOiB2b2lkIHtcclxuICAgIC8vIEBoYWNrIHRoZXJlJ3MgYSBtZW1vcnkgbGVhayB3aXRoaW4gQW5ndWxhciBhbmQgdGhvc2UgY29tcG9uZW50c1xyXG4gICAgLy8gYXJlIG5vdCBjb3JyZWN0bHkgY2xlYW5lZCB1cCB3aGljaCBsZWFkcyB0byBlcnJvciBpZiBhIGZvcm0gaXMgZGVmaW5lZFxyXG4gICAgLy8gd2l0aCB2YWxpZGF0b3JzIGFuZCB0aGVuIGl0J3MgYmVlbiByZW1vdmVkLCB0aGUgdmFsaWRhdG9yIHdvdWxkIHN0aWxsIGZhaWxcclxuICAgIC8vIGBhcyBhbnlgIGlmIGJlY2F1c2Ugd2UgZG8gbm90IHdhbnQgdG8gZGVmaW5lIHRoZSBmb3JtR3JvdXAgYXMgRm9ybUdyb3VwIHwgdW5kZWZpbmVkXHJcbiAgICAvLyBldmVyeXRoaW5nIHJlbGF0ZWQgdG8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhbmQgc2hvdWxkbid0IGJlIGV4cG9zZWQgdG8gZW5kIHVzZXJcclxuICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbikge1xyXG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmVtaXROdWxsT25EZXN0cm95ICYmIHRoaXMub25DaGFuZ2UpIHtcclxuICAgICAgdGhpcy5vbkNoYW5nZShudWxsKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9uQ2hhbmdlID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgLy8gd2hlbiBnZXREZWZhdWx0VmFsdWVzIGlzIGRlZmluZWQsIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gIC8vIGluIHlvdXIgZm9ybSAodGhlIG9uZXMgZGVmaW5lZCB3aXRoaW4gdGhlIGBnZXRGb3JtQ29udHJvbHNgIG1ldGhvZClcclxuICBwcm90ZWN0ZWQgZ2V0RGVmYXVsdFZhbHVlcygpOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB3cml0ZVZhbHVlKG9iajogUmVxdWlyZWQ8Q29udHJvbEludGVyZmFjZT4gfCBudWxsKTogdm9pZCB7XHJcbiAgICAvLyBAaGFjayBzZWUgd2hlcmUgZGVmaW5pbmcgdGhpcy5mb3JtR3JvdXAgdG8gdW5kZWZpbmVkXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWU6IEZvcm1JbnRlcmZhY2UgfCBudWxsID0gdGhpcy50cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgICAgb2JqID09PSB1bmRlZmluZWQgPyBudWxsIDogb2JqLFxyXG4gICAgICBkZWZhdWx0VmFsdWVzLFxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoaXNOdWxsT3JVbmRlZmluZWQodHJhbnNmb3JtZWRWYWx1ZSkpIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAucmVzZXQoXHJcbiAgICAgICAgLy8gY2FsbGluZyBgcmVzZXRgIG9uIGEgZm9ybSB3aXRoIGBudWxsYCB0aHJvd3MgYW4gZXJyb3IgYnV0IGlmIG5vdGhpbmcgaXMgcGFzc2VkXHJcbiAgICAgICAgLy8gKHVuZGVmaW5lZCkgaXQgd2lsbCByZXNldCBhbGwgdGhlIGZvcm0gdmFsdWVzIHRvIG51bGwgKGFzIGV4cGVjdGVkKVxyXG4gICAgICAgIGRlZmF1bHRWYWx1ZXMgPT09IG51bGwgPyB1bmRlZmluZWQgOiBkZWZhdWx0VmFsdWVzLFxyXG4gICAgICAgIC8vIGVtaXQgdG8ga2VlcCBpbnRlcm5hbCBhbmQgZXh0ZXJuYWwgaW5mb3JtYXRpb24gYWJvdXQgZGF0YSBpbiBvZiBjb250cm9sIGluIHN5bmMsIHdoZW5cclxuICAgICAgICAvLyBudWxsL3VuZGVmaW5lZCB3YXMgcGFzc2VkIGludG8gd3JpdGVWYWx1ZVxyXG4gICAgICAgIC8vIHdoaWxlIGludGVybmFsbHkgYmVpbmcgcmVwbGFjZWQgd2l0aCBkZWZhdWx0VmFsdWVzXHJcbiAgICAgICAgeyBlbWl0RXZlbnQ6IGlzTnVsbE9yVW5kZWZpbmVkKG9iaikgJiYgIWlzTnVsbE9yVW5kZWZpbmVkKGRlZmF1bHRWYWx1ZXMpIH0sXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBtaXNzaW5nS2V5czogKGtleW9mIEZvcm1JbnRlcmZhY2UpW10gPSB0aGlzLmdldE1pc3NpbmdLZXlzKHRyYW5zZm9ybWVkVmFsdWUpO1xyXG4gICAgICBpZiAobWlzc2luZ0tleXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBNaXNzaW5nRm9ybUNvbnRyb2xzRXJyb3IobWlzc2luZ0tleXMgYXMgc3RyaW5nW10pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKHRyYW5zZm9ybWVkVmFsdWUpO1xyXG5cclxuICAgICAgLy8gVGhlIG5leHQgZmV3IGxpbmVzIGFyZSB3ZWlyZCBidXQgaXQncyBhcyB3b3JrYXJvdW5kLlxyXG4gICAgICAvLyBUaGVyZSBhcmUgc29tZSBzaGFkeSBiZWhhdmlvciB3aXRoIHRoZSBkaXNhYmxlZCBzdGF0ZVxyXG4gICAgICAvLyBvZiBhIGZvcm0uIEFwcGFyZW50bHksIHVzaW5nIGBzZXRWYWx1ZWAgb24gYSBkaXNhYmxlZFxyXG4gICAgICAvLyBmb3JtIGRvZXMgcmUtZW5hYmxlIGl0ICpzb21ldGltZXMqLCBub3QgYWx3YXlzLlxyXG4gICAgICAvLyByZWxhdGVkIGlzc3VlczpcclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMzE1MDZcclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMjI1NTZcclxuICAgICAgLy8gYnV0IGlmIHlvdSBkaXNwbGF5IGB0aGlzLmZvcm1Hcm91cC5kaXNhYmxlZGBcclxuICAgICAgLy8gYmVmb3JlIGFuZCBhZnRlciB0aGUgYHNldFZhbHVlYCBpcyBjYWxsZWQsIGl0J3MgdGhlIHNhbWVcclxuICAgICAgLy8gcmVzdWx0IHdoaWNoIGlzIGV2ZW4gd2VpcmRlclxyXG4gICAgICBjb25zdCBmZ0Rpc2FibGVkOiBib29sZWFuID0gdGhpcy5mb3JtR3JvdXAuZGlzYWJsZWQ7XHJcblxyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWx1ZSh0cmFuc2Zvcm1lZFZhbHVlLCB7XHJcbiAgICAgICAgLy8gZW1pdCB0byBrZWVwIGludGVybmFsIGFuZCBleHRlcm5hbCBpbmZvcm1hdGlvbiBhYm91dCBkYXRhIGluIG9mIGNvbnRyb2wgaW4gc3luYywgd2hlblxyXG4gICAgICAgIC8vIG51bGwvdW5kZWZpbmVkIHdhcyBwYXNzZWQgaW50byB3cml0ZVZhbHVlXHJcbiAgICAgICAgLy8gd2hpbGUgaW50ZXJuYWxseSBiZWluZyByZXBsYWNlZCB3aXRoIHRyYW5zZm9ybWVkVmFsdWVcclxuICAgICAgICBlbWl0RXZlbnQ6IGlzTnVsbE9yVW5kZWZpbmVkKG9iaiksXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKGZnRGlzYWJsZWQpIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5kaXNhYmxlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZvcm1Hcm91cC5tYXJrQXNQcmlzdGluZSgpO1xyXG4gICAgdGhpcy5mb3JtR3JvdXAubWFya0FzVW50b3VjaGVkKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKG9iajogYW55KSB7XHJcbiAgICBPYmplY3QuZW50cmllcyhvYmopLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgaW5zdGFuY2VvZiBGb3JtQXJyYXkgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBjb25zdCBmb3JtQXJyYXk6IEZvcm1BcnJheSA9IHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGFzIEZvcm1BcnJheTtcclxuXHJcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBjcmVhdGluZyBhIG5ldyBhcnJheSBldmVyeSB0aW1lIGFuZCBwdXNoIGEgbmV3IEZvcm1Db250cm9sXHJcbiAgICAgICAgLy8gd2UganVzdCByZW1vdmUgb3IgYWRkIHdoYXQgaXMgbmVjZXNzYXJ5IHNvIHRoYXQ6XHJcbiAgICAgICAgLy8gLSBpdCBpcyBhcyBlZmZpY2llbnQgYXMgcG9zc2libGUgYW5kIGRvIG5vdCBjcmVhdGUgdW5uZWNlc3NhcnkgRm9ybUNvbnRyb2wgZXZlcnkgdGltZVxyXG4gICAgICAgIC8vIC0gdmFsaWRhdG9ycyBhcmUgbm90IGRlc3Ryb3llZC9jcmVhdGVkIGFnYWluIGFuZCBldmVudHVhbGx5IGZpcmUgYWdhaW4gZm9yIG5vIHJlYXNvblxyXG4gICAgICAgIHdoaWxlIChmb3JtQXJyYXkubGVuZ3RoID4gdmFsdWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICBmb3JtQXJyYXkucmVtb3ZlQXQoZm9ybUFycmF5Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZvcm1BcnJheS5sZW5ndGg7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCkpIHtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCB0aGlzLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2woa2V5IGFzIEFycmF5UHJvcGVydHlLZXk8Rm9ybUludGVyZmFjZT4sIHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE1pc3NpbmdLZXlzKHRyYW5zZm9ybWVkVmFsdWU6IEZvcm1JbnRlcmZhY2UgfCBudWxsKSB7XHJcbiAgICAvLyBgY29udHJvbEtleXNgIGNhbiBiZSBhbiBlbXB0eSBhcnJheSwgZW1wdHkgZm9ybXMgYXJlIGFsbG93ZWRcclxuICAgIGNvbnN0IG1pc3NpbmdLZXlzOiAoa2V5b2YgRm9ybUludGVyZmFjZSlbXSA9IHRoaXMuY29udHJvbEtleXMucmVkdWNlKChrZXlzLCBrZXkpID0+IHtcclxuICAgICAgaWYgKGlzTnVsbE9yVW5kZWZpbmVkKHRyYW5zZm9ybWVkVmFsdWUpIHx8IHRyYW5zZm9ybWVkVmFsdWVba2V5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfSwgW10gYXMgKGtleW9mIEZvcm1JbnRlcmZhY2UpW10pO1xyXG5cclxuICAgIHJldHVybiBtaXNzaW5nS2V5cztcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gY3VzdG9taXppbmcgdGhlIGVtaXNzaW9uIHJhdGUgb2YgeW91ciBzdWIgZm9ybSBjb21wb25lbnQsIHJlbWVtYmVyIG5vdCB0byAqKm11dGF0ZSoqIHRoZSBzdHJlYW1cclxuICAvLyBpdCBpcyBzYWZlIHRvIHRocm90dGxlLCBkZWJvdW5jZSwgZGVsYXksIGV0YyBidXQgdXNpbmcgc2tpcCwgZmlyc3QsIGxhc3Qgb3IgbXV0YXRpbmcgZGF0YSBpbnNpZGVcclxuICAvLyB0aGUgc3RyZWFtIHdpbGwgY2F1c2UgaXNzdWVzIVxyXG4gIHByb3RlY3RlZCBoYW5kbGVFbWlzc2lvblJhdGUoKTogKG9icyQ6IE9ic2VydmFibGU8Rm9ybUludGVyZmFjZT4pID0+IE9ic2VydmFibGU8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIGFueSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlZ2lzdGVyT25DaGFuZ2UoZm46IChfOiBhbnkpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub25DaGFuZ2UgPSBmbjtcclxuXHJcbiAgICBpbnRlcmZhY2UgS2V5VmFsdWVGb3JtIHtcclxuICAgICAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlO1xyXG4gICAgICB2YWx1ZTogdW5rbm93bjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtQ29udHJvbE5hbWVzOiAoa2V5b2YgRm9ybUludGVyZmFjZSlbXSA9IE9iamVjdC5rZXlzKHRoaXMuZm9ybUNvbnRyb2xOYW1lcykgYXMgKGtleW9mIEZvcm1JbnRlcmZhY2UpW107XHJcblxyXG4gICAgY29uc3QgZm9ybVZhbHVlczogT2JzZXJ2YWJsZTxLZXlWYWx1ZUZvcm0+W10gPSBmb3JtQ29udHJvbE5hbWVzLm1hcChrZXkgPT5cclxuICAgICAgKCh0aGlzLmZvcm1Hcm91cC5jb250cm9sc1trZXldIGFzIHVua25vd24pIGFzIEFic3RyYWN0Q29udHJvbCkudmFsdWVDaGFuZ2VzLnBpcGUoXHJcbiAgICAgICAgc3RhcnRXaXRoKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzW2tleV0udmFsdWUpLFxyXG4gICAgICAgIG1hcCh2YWx1ZSA9PiAoeyBrZXksIHZhbHVlIH0pKSxcclxuICAgICAgKSxcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgbGFzdEtleUVtaXR0ZWQkOiBPYnNlcnZhYmxlPGtleW9mIEZvcm1JbnRlcmZhY2U+ID0gbWVyZ2UoLi4uZm9ybVZhbHVlcy5tYXAob2JzID0+IG9icy5waXBlKG1hcCh4ID0+IHgua2V5KSkpKTtcclxuXHJcbiAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IHRoaXMuZm9ybUdyb3VwLnZhbHVlQ2hhbmdlc1xyXG4gICAgICAucGlwZShcclxuICAgICAgICAvLyBob29rIHRvIGdpdmUgYWNjZXNzIHRvIHRoZSBvYnNlcnZhYmxlIGZvciBzdWItY2xhc3Nlc1xyXG4gICAgICAgIC8vIHRoaXMgYWxsb3cgc3ViLWNsYXNzZXMgKGZvciBleGFtcGxlKSB0byBkZWJvdW5jZSwgdGhyb3R0bGUsIGV0Y1xyXG4gICAgICAgIHRoaXMuaGFuZGxlRW1pc3Npb25SYXRlKCksXHJcbiAgICAgICAgc3RhcnRXaXRoKHRoaXMuZm9ybUdyb3VwLnZhbHVlKSxcclxuICAgICAgICAvLyB0aGlzIGlzIHJlcXVpcmVkIG90aGVyd2lzZSBhbiBgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcmAgd2lsbCBoYXBwZW5cclxuICAgICAgICAvLyB0aGlzIGlzIGR1ZSB0byB0aGUgZmFjdCB0aGF0IHBhcmVudCBjb21wb25lbnQgd2lsbCBkZWZpbmUgYSBnaXZlbiBzdGF0ZSBmb3IgdGhlIGZvcm0gdGhhdCBtaWdodFxyXG4gICAgICAgIC8vIGJlIGNoYW5nZWQgb25jZSB0aGUgY2hpbGRyZW4gYXJlIGJlaW5nIGluaXRpYWxpemVkXHJcbiAgICAgICAgZGVsYXkoMCksXHJcbiAgICAgICAgZmlsdGVyKCgpID0+ICEhdGhpcy5mb3JtR3JvdXApLFxyXG4gICAgICAgIC8vIGRldGVjdCB3aGljaCBzdHJlYW0gZW1pdHRlZCBsYXN0XHJcbiAgICAgICAgd2l0aExhdGVzdEZyb20obGFzdEtleUVtaXR0ZWQkKSxcclxuICAgICAgICBtYXAoKFtfLCBrZXlMYXN0RW1pdF0sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICBpZiAoaW5kZXggPiAwICYmIHRoaXMub25Ub3VjaGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25Ub3VjaGVkKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGluZGV4ID4gMCB8fCAoaW5kZXggPT09IDAgJiYgdGhpcy5lbWl0SW5pdGlhbFZhbHVlT25Jbml0KSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMub25DaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoXHJcbiAgICAgICAgICAgICAgICAgIC8vIGRvIG5vdCB1c2UgdGhlIGNoYW5nZXMgcGFzc2VkIGJ5IGB0aGlzLmZvcm1Hcm91cC52YWx1ZUNoYW5nZXNgIGhlcmVcclxuICAgICAgICAgICAgICAgICAgLy8gYXMgd2UndmUgZ290IGEgZGVsYXkoMCkgYWJvdmUsIG9uIHRoZSBuZXh0IHRpY2sgdGhlIGZvcm0gZGF0YSBtaWdodFxyXG4gICAgICAgICAgICAgICAgICAvLyBiZSBvdXRkYXRlZCBhbmQgbWlnaHQgcmVzdWx0IGludG8gYW4gaW5jb25zaXN0ZW50IHN0YXRlIHdoZXJlIGEgZm9ybVxyXG4gICAgICAgICAgICAgICAgICAvLyBzdGF0ZSBpcyB2YWxpZCAoYmFzZSBvbiBsYXRlc3QgdmFsdWUpIGJ1dCB0aGUgcHJldmlvdXMgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgLy8gKHRoZSBvbmUgcGFzc2VkIGJ5IGB0aGlzLmZvcm1Hcm91cC52YWx1ZUNoYW5nZXNgIHdvdWxkIGJlIHRoZSBwcmV2aW91cyBvbmUpXHJcbiAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybUdyb3VwLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmb3JtVXBkYXRlOiBGb3JtVXBkYXRlPEZvcm1JbnRlcmZhY2U+ID0ge307XHJcbiAgICAgICAgICAgIGZvcm1VcGRhdGVba2V5TGFzdEVtaXRdID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5vbkZvcm1VcGRhdGUoZm9ybVVwZGF0ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSksXHJcbiAgICAgIClcclxuICAgICAgLnN1YnNjcmliZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBhbnkpOiB2b2lkIHtcclxuICAgIHRoaXMub25Ub3VjaGVkID0gZm47XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0RGlzYWJsZWRTdGF0ZShzaG91bGREaXNhYmxlOiBib29sZWFuIHwgdW5kZWZpbmVkKTogdm9pZCB7XHJcbiAgICB0aGlzLmNvbnRyb2xEaXNhYmxlZCA9ICEhc2hvdWxkRGlzYWJsZTtcclxuXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2hvdWxkRGlzYWJsZSkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5kaXNhYmxlKHsgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLmVuYWJsZSh7IGVtaXRFdmVudDogZmFsc2UgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT4gZXh0ZW5kcyBOZ3hTdWJGb3JtQ29tcG9uZW50PFxyXG4gIENvbnRyb2xJbnRlcmZhY2UsXHJcbiAgRm9ybUludGVyZmFjZVxyXG4+IHtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGw7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGw7XHJcbn1cclxuIl19