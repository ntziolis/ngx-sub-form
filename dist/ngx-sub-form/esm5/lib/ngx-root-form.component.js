import { __decorate, __extends, __metadata } from "tslib";
import { ChangeDetectorRef, Directive, EventEmitter, OnDestroy, OnInit, Optional } from '@angular/core';
import isEqual from 'fast-deep-equal';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { isNullOrUndefined, takeUntilDestroyed } from './ngx-sub-form-utils';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
import { SubFormGroup } from './sub-form-group';
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
export { NgxRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXJvb3QtZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvbmd4LXJvb3QtZm9ybS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3hHLE9BQU8sT0FBTyxNQUFNLGlCQUFpQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVwRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFJaEQ7SUFDVSx3Q0FBeUQ7SUFlakUseURBQXlEO0lBQ3pELDhFQUE4RTtJQUM5RSw4QkFBWSxFQUFxQjtRQUFqQyxZQUNFLGlCQUFPLFNBU1I7UUF0QkQsb0VBQW9FO1FBQ3BFLG1EQUFtRDtRQUNuRCxnQkFBZ0I7UUFDTixrQkFBWSxHQUE4QixJQUFJLE9BQU8sRUFBRSxDQUFDO1FBRXhELDRCQUFzQixHQUFHLEtBQUssQ0FBQztRQUMvQix1QkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFMUIsZUFBUyxHQUE0QixJQUFJLENBQUM7UUFNbEQsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFlBQVksQ0FBa0MsRUFBRSxDQUdwRSxDQUFDO1FBRUYsSUFBSSxFQUFFLEVBQUU7WUFDTixLQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDOztJQUNILENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsMENBQVcsR0FBWCxjQUFxQixDQUFDO0lBRWYsdUNBQVEsR0FBZjtRQUFBLGlCQVFDO1FBUEMsSUFBSSxDQUFDLFlBQVk7YUFDZCxJQUFJLENBQ0gsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQ3hCLE1BQU0sQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQXBCLENBQW9CLENBQUMsRUFDbEMsR0FBRyxDQUFDLFVBQUEsS0FBSyxJQUFJLE9BQUEsS0FBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQTNCLENBQTJCLENBQUMsQ0FDMUM7YUFDQSxTQUFTLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQsZ0JBQWdCO0lBQ04scURBQXNCLEdBQWhDLFVBQWlDLElBQTZCO1FBQzVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0QsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVTLG1EQUFvQixHQUE5QixVQUNFLEdBQTRCLEVBQzVCLGFBQTRDO1FBRTVDLE9BQVEsR0FBZ0MsQ0FBQztJQUMzQyxDQUFDO0lBRVMscURBQXNCLEdBQWhDLFVBQWlDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBeUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0seUNBQVUsR0FBakI7UUFDRSw4QkFBOEI7UUFDOUIsa0RBQWtEO1FBQ2xELDRDQUE0QztRQUM1QyxJQUFJO1FBQ0osSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQWdDLENBQUM7UUFDakUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUM5RCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDOztnQkF2RGUsaUJBQWlCOztJQWxCYixvQkFBb0I7UUFGekMsU0FBUyxFQUFFO1FBQ1osbURBQW1EOzt5Q0FtQmpDLGlCQUFpQjtPQWxCYixvQkFBb0IsQ0EwRXpDO0lBQUQsMkJBQUM7Q0FBQSxBQTFFRCxDQUNVLHdCQUF3QixHQXlFakM7U0ExRXFCLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdG9yUmVmLCBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgT25EZXN0cm95LCBPbkluaXQsIE9wdGlvbmFsIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCBpc0VxdWFsIGZyb20gJ2Zhc3QtZGVlcC1lcXVhbCc7XHJcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgZmlsdGVyLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcblxyXG5pbXBvcnQgeyBpc051bGxPclVuZGVmaW5lZCwgdGFrZVVudGlsRGVzdHJveWVkIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hSb290Rm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBleHRlbmRzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xyXG4gIHB1YmxpYyBhYnN0cmFjdCBkYXRhSW5wdXQ6IFJlcXVpcmVkPENvbnRyb2xJbnRlcmZhY2U+IHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgcHVibGljIGFic3RyYWN0IGRhdGFPdXRwdXQ6IEV2ZW50RW1pdHRlcjxDb250cm9sSW50ZXJmYWNlPjtcclxuICAvLyB1c2luZyBhIHByaXZhdGUgdmFyaWFibGUgYF9kYXRhT3V0cHV0JGAgdG8gYmUgYWJsZSB0byBjb250cm9sIHRoZVxyXG4gIC8vIGVtaXNzaW9uIHJhdGUgd2l0aCBhIGRlYm91bmNlIG9yIHRocm90dGxlIGZvciBleFxyXG4gIC8qKiBAaW50ZXJuYWwgKi9cclxuICBwcm90ZWN0ZWQgX2RhdGFPdXRwdXQkOiBTdWJqZWN0PENvbnRyb2xJbnRlcmZhY2U+ID0gbmV3IFN1YmplY3QoKTtcclxuXHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSBmYWxzZTtcclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSBmYWxzZTtcclxuXHJcbiAgcHJvdGVjdGVkIGRhdGFWYWx1ZTogQ29udHJvbEludGVyZmFjZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBjaGFuZ2UgZGV0ZWN0b3Igb25seSBuZWVkcyB0byBiZSBwYXNzZWQgZnJvbSByb290IGZvcm1cclxuICAvLyBmb3Igc3ViIGZvcm1zIHRoZSBzdWItZm9ybS1kaXJlY3RpdmUgaW5qZWN0cyB0aGUgY2hhbmdlIGRldGVjdG9yIHJlZiBmb3IgdXNcclxuICBjb25zdHJ1Y3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICB0aGlzLmZvcm1Hcm91cCA9IG5ldyBTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT4oe30pIGFzIFR5cGVkU3ViRm9ybUdyb3VwPFxyXG4gICAgICBDb250cm9sSW50ZXJmYWNlLFxyXG4gICAgICBGb3JtSW50ZXJmYWNlXHJcbiAgICA+O1xyXG5cclxuICAgIGlmIChjZCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRDaGFuZ2VEZXRlY3RvcihjZCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBuZWVkZWQgZm9yIHRha2UgdW50aWwgZGVzdHJveWVkXHJcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7fVxyXG5cclxuICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kYXRhT3V0cHV0JFxyXG4gICAgICAucGlwZShcclxuICAgICAgICB0YWtlVW50aWxEZXN0cm95ZWQodGhpcyksXHJcbiAgICAgICAgZmlsdGVyKCgpID0+IHRoaXMuZm9ybUdyb3VwLnZhbGlkKSxcclxuICAgICAgICB0YXAodmFsdWUgPT4gdGhpcy5kYXRhT3V0cHV0LmVtaXQodmFsdWUpKSxcclxuICAgICAgKVxyXG4gICAgICAuc3Vic2NyaWJlKCk7XHJcbiAgfVxyXG5cclxuICAvKiogQGludGVybmFsICovXHJcbiAgcHJvdGVjdGVkIG9uUmVnaXN0ZXJPbkNoYW5nZUhvb2soZGF0YTogQ29udHJvbEludGVyZmFjZSB8IG51bGwpOiBib29sZWFuIHtcclxuICAgIGlmICh0aGlzLmZvcm1Hcm91cC5pbnZhbGlkIHx8IGlzRXF1YWwoZGF0YSwgdGhpcy5kYXRhSW5wdXQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRhdGFWYWx1ZSA9IGRhdGE7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKG9iaiBhcyB1bmtub3duKSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgdW5rbm93bikgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBtYW51YWxTYXZlKCk6IHZvaWQge1xyXG4gICAgLy8gaWYgKHRoaXMuZm9ybUdyb3VwLnZhbGlkKSB7XHJcbiAgICAvLyAgIHRoaXMuZGF0YVZhbHVlID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbFZhbHVlO1xyXG4gICAgLy8gICB0aGlzLl9kYXRhT3V0cHV0JC5uZXh0KHRoaXMuZGF0YVZhbHVlKTtcclxuICAgIC8vIH1cclxuICAgIHRoaXMuZGF0YVZhbHVlID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbFZhbHVlIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKHRoaXMuZGF0YVZhbHVlKSAmJiB0aGlzLmZvcm1Hcm91cC52YWxpZCkge1xyXG4gICAgICB0aGlzLl9kYXRhT3V0cHV0JC5uZXh0KHRoaXMuZGF0YVZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19