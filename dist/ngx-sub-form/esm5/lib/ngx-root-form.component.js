import { __decorate, __extends, __metadata } from "tslib";
import { Input, Directive } from '@angular/core';
import isEqual from 'fast-deep-equal';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
import { takeUntilDestroyed, isNullOrUndefined } from './ngx-sub-form-utils';
var NgxRootFormComponent = /** @class */ (function (_super) {
    __extends(NgxRootFormComponent, _super);
    // tslint:disable-next-line: directive-class-suffix
    function NgxRootFormComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // `Input` values are set while the `ngOnChanges` hook is ran
        // and it does happen before the `ngOnInit` where we start
        // listening to `dataInput$`. Therefore, it cannot be a `Subject`
        // or we will miss the first value
        _this.dataInput$ = new BehaviorSubject(null);
        // using a private variable `_dataOutput$` to be able to control the
        // emission rate with a debounce or throttle for ex
        /** @internal */
        _this._dataOutput$ = new Subject();
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
            .pipe(filter(function (newValue) { return !isEqual(newValue, _this.formGroup.value); }), tap(function (newValue) {
            if (!isNullOrUndefined(newValue)) {
                _this.writeValue(newValue);
            }
        }), takeUntilDestroyed(this))
            .subscribe();
        this._dataOutput$
            .pipe(filter(function () { return _this.formGroup.valid; }), tap(function (value) { return _this.dataOutput.emit(value); }), takeUntilDestroyed(this))
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
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], NgxRootFormComponent.prototype, "disabled", null);
    NgxRootFormComponent = __decorate([
        Directive()
        // tslint:disable-next-line: directive-class-suffix
    ], NgxRootFormComponent);
    return NgxRootFormComponent;
}(NgxSubFormRemapComponent));
export { NgxRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXJvb3QtZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvbmd4LXJvb3QtZm9ybS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBd0IsS0FBSyxFQUFhLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNsRixPQUFPLE9BQU8sTUFBTSxpQkFBaUIsQ0FBQztBQUN0QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNoRCxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBSTdFO0lBQ1Usd0NBQXlEO0lBRm5FLG1EQUFtRDtJQUNuRDtRQUFBLHFFQTRGQztRQXhGQyw2REFBNkQ7UUFDN0QsMERBQTBEO1FBQzFELGlFQUFpRTtRQUNqRSxrQ0FBa0M7UUFDeEIsZ0JBQVUsR0FBbUUsSUFBSSxlQUFlLENBRXhHLElBQUksQ0FBQyxDQUFDO1FBR1Isb0VBQW9FO1FBQ3BFLG1EQUFtRDtRQUNuRCxnQkFBZ0I7UUFDTixrQkFBWSxHQUE4QixJQUFJLE9BQU8sRUFBRSxDQUFDO1FBT3hELDRCQUFzQixHQUFHLEtBQUssQ0FBQztRQUMvQix1QkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFMUIsZUFBUyxHQUE0QixJQUFJLENBQUM7O0lBa0V0RCxDQUFDO0lBekVDLHNCQUFXLDBDQUFRO2FBQW5CLFVBQW9CLGFBQWtDO1lBQ3BELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN2QyxDQUFDOzs7T0FBQTtJQU9NLHVDQUFRLEdBQWY7UUFBQSxpQkF5QkM7UUF4QkMsa0VBQWtFO1FBQ2xFLGlFQUFpRTtRQUNqRSxzRUFBc0U7UUFDdEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQUEsSUFBSSxJQUFJLE9BQUEsS0FBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFqQyxDQUFpQyxDQUFDLENBQUM7UUFFakUsSUFBSSxDQUFDLFVBQVU7YUFDWixJQUFJLENBQ0gsTUFBTSxDQUFDLFVBQUEsUUFBUSxJQUFJLE9BQUEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQXhDLENBQXdDLENBQUMsRUFDNUQsR0FBRyxDQUFDLFVBQUEsUUFBUTtZQUNWLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDaEMsS0FBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMzQjtRQUNILENBQUMsQ0FBQyxFQUNGLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUN6QjthQUNBLFNBQVMsRUFBRSxDQUFDO1FBRWYsSUFBSSxDQUFDLFlBQVk7YUFDZCxJQUFJLENBQ0gsTUFBTSxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBcEIsQ0FBb0IsQ0FBQyxFQUNsQyxHQUFHLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBM0IsQ0FBMkIsQ0FBQyxFQUN6QyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FDekI7YUFDQSxTQUFTLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQsZ0JBQWdCO0lBQ04scURBQXNCLEdBQWhDLFVBQWlDLElBQTZCO1FBQzVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xFLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxvQ0FBb0M7SUFDcEMsZ0JBQWdCO0lBQ1QsK0NBQWdCLEdBQXZCLFVBQXdCLElBQW1EO1FBQ3pFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSx5Q0FBVSxHQUFqQixVQUFrQixHQUFzQztRQUN0RCxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztRQUNyQixpQkFBTSxVQUFVLFlBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVTLG1EQUFvQixHQUE5QixVQUNFLEdBQTRCLEVBQzVCLGFBQTRDO1FBRTVDLE9BQVEsR0FBZ0MsQ0FBQztJQUMzQyxDQUFDO0lBRVMscURBQXNCLEdBQWhDLFVBQWlDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBeUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0seUNBQVUsR0FBakI7UUFDRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO1lBQzlELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN4QztJQUNILENBQUM7SUF4RUQ7UUFEQyxLQUFLLEVBQUU7Ozt3REFHUDtJQXJCbUIsb0JBQW9CO1FBRnpDLFNBQVMsRUFBRTtRQUNaLG1EQUFtRDtPQUM3QixvQkFBb0IsQ0E0RnpDO0lBQUQsMkJBQUM7Q0FBQSxBQTVGRCxDQUNVLHdCQUF3QixHQTJGakM7U0E1RnFCLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciwgT25Jbml0LCBJbnB1dCwgQ29tcG9uZW50LCBEaXJlY3RpdmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IGlzRXF1YWwgZnJvbSAnZmFzdC1kZWVwLWVxdWFsJztcclxuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0LCBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IGZpbHRlciwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyB0YWtlVW50aWxEZXN0cm95ZWQsIGlzTnVsbE9yVW5kZWZpbmVkIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4Um9vdEZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgZXh0ZW5kcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uSW5pdCB7XHJcbiAgcHVibGljIGFic3RyYWN0IGRhdGFJbnB1dDogUmVxdWlyZWQ8Q29udHJvbEludGVyZmFjZT4gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG4gIC8vIGBJbnB1dGAgdmFsdWVzIGFyZSBzZXQgd2hpbGUgdGhlIGBuZ09uQ2hhbmdlc2AgaG9vayBpcyByYW5cclxuICAvLyBhbmQgaXQgZG9lcyBoYXBwZW4gYmVmb3JlIHRoZSBgbmdPbkluaXRgIHdoZXJlIHdlIHN0YXJ0XHJcbiAgLy8gbGlzdGVuaW5nIHRvIGBkYXRhSW5wdXQkYC4gVGhlcmVmb3JlLCBpdCBjYW5ub3QgYmUgYSBgU3ViamVjdGBcclxuICAvLyBvciB3ZSB3aWxsIG1pc3MgdGhlIGZpcnN0IHZhbHVlXHJcbiAgcHJvdGVjdGVkIGRhdGFJbnB1dCQ6IEJlaGF2aW9yU3ViamVjdDxSZXF1aXJlZDxDb250cm9sSW50ZXJmYWNlPiB8IG51bGwgfCB1bmRlZmluZWQ+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxcclxuICAgIFJlcXVpcmVkPENvbnRyb2xJbnRlcmZhY2U+IHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4gID4obnVsbCk7XHJcblxyXG4gIHB1YmxpYyBhYnN0cmFjdCBkYXRhT3V0cHV0OiBFdmVudEVtaXR0ZXI8Q29udHJvbEludGVyZmFjZT47XHJcbiAgLy8gdXNpbmcgYSBwcml2YXRlIHZhcmlhYmxlIGBfZGF0YU91dHB1dCRgIHRvIGJlIGFibGUgdG8gY29udHJvbCB0aGVcclxuICAvLyBlbWlzc2lvbiByYXRlIHdpdGggYSBkZWJvdW5jZSBvciB0aHJvdHRsZSBmb3IgZXhcclxuICAvKiogQGludGVybmFsICovXHJcbiAgcHJvdGVjdGVkIF9kYXRhT3V0cHV0JDogU3ViamVjdDxDb250cm9sSW50ZXJmYWNlPiA9IG5ldyBTdWJqZWN0KCk7XHJcblxyXG4gIEBJbnB1dCgpXHJcbiAgcHVibGljIHNldCBkaXNhYmxlZChzaG91bGREaXNhYmxlOiBib29sZWFuIHwgdW5kZWZpbmVkKSB7XHJcbiAgICB0aGlzLnNldERpc2FibGVkU3RhdGUoc2hvdWxkRGlzYWJsZSk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IGZhbHNlO1xyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IGZhbHNlO1xyXG5cclxuICBwcm90ZWN0ZWQgZGF0YVZhbHVlOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIC8vIHdlIG5lZWQgdG8gbWFudWFsbHkgY2FsbCByZWdpc3Rlck9uQ2hhbmdlIGJlY2F1c2UgdGhhdCBmdW5jdGlvblxyXG4gICAgLy8gaGFuZGxlcyBtb3N0IG9mIHRoZSBsb2dpYyBmcm9tIE5neFN1YkZvcm0gYW5kIHdoZW4gaXQncyBjYWxsZWRcclxuICAgIC8vIGFzIGEgQ29udHJvbFZhbHVlQWNjZXNzb3IgdGhhdCBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgQW5ndWxhciBpdHNlbGZcclxuICAgIHRoaXMucmVnaXN0ZXJPbkNoYW5nZShkYXRhID0+IHRoaXMub25SZWdpc3Rlck9uQ2hhbmdlSG9vayhkYXRhKSk7XHJcblxyXG4gICAgdGhpcy5kYXRhSW5wdXQkXHJcbiAgICAgIC5waXBlKFxyXG4gICAgICAgIGZpbHRlcihuZXdWYWx1ZSA9PiAhaXNFcXVhbChuZXdWYWx1ZSwgdGhpcy5mb3JtR3JvdXAudmFsdWUpKSxcclxuICAgICAgICB0YXAobmV3VmFsdWUgPT4ge1xyXG4gICAgICAgICAgaWYgKCFpc051bGxPclVuZGVmaW5lZChuZXdWYWx1ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy53cml0ZVZhbHVlKG5ld1ZhbHVlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSxcclxuICAgICAgICB0YWtlVW50aWxEZXN0cm95ZWQodGhpcyksXHJcbiAgICAgIClcclxuICAgICAgLnN1YnNjcmliZSgpO1xyXG5cclxuICAgIHRoaXMuX2RhdGFPdXRwdXQkXHJcbiAgICAgIC5waXBlKFxyXG4gICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLmZvcm1Hcm91cC52YWxpZCksXHJcbiAgICAgICAgdGFwKHZhbHVlID0+IHRoaXMuZGF0YU91dHB1dC5lbWl0KHZhbHVlKSksXHJcbiAgICAgICAgdGFrZVVudGlsRGVzdHJveWVkKHRoaXMpLFxyXG4gICAgICApXHJcbiAgICAgIC5zdWJzY3JpYmUoKTtcclxuICB9XHJcblxyXG4gIC8qKiBAaW50ZXJuYWwgKi9cclxuICBwcm90ZWN0ZWQgb25SZWdpc3Rlck9uQ2hhbmdlSG9vayhkYXRhOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwLmludmFsaWQgfHwgaXNFcXVhbChkYXRhLCB0aGlzLmRhdGFJbnB1dCQudmFsdWUpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRhdGFWYWx1ZSA9IGRhdGE7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIGNhbGxlZCBieSB0aGUgRGF0YUlucHV0IGRlY29yYXRvclxyXG4gIC8qKiBAaW50ZXJuYWwgKi9cclxuICBwdWJsaWMgZGF0YUlucHV0VXBkYXRlZChkYXRhOiBSZXF1aXJlZDxDb250cm9sSW50ZXJmYWNlPiB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcclxuICAgIHRoaXMuZGF0YUlucHV0JC5uZXh0KGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHdyaXRlVmFsdWUob2JqOiBSZXF1aXJlZDxDb250cm9sSW50ZXJmYWNlPiB8IG51bGwpOiB2b2lkIHtcclxuICAgIHRoaXMuZGF0YVZhbHVlID0gb2JqO1xyXG4gICAgc3VwZXIud3JpdGVWYWx1ZShvYmopO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIHVua25vd24pIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyB1bmtub3duKSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG1hbnVhbFNhdmUoKTogdm9pZCB7XHJcbiAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKHRoaXMuZGF0YVZhbHVlKSAmJiB0aGlzLmZvcm1Hcm91cC52YWxpZCkge1xyXG4gICAgICB0aGlzLl9kYXRhT3V0cHV0JC5uZXh0KHRoaXMuZGF0YVZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19