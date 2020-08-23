import { __decorate, __extends, __metadata } from "tslib";
import { ChangeDetectorRef, Directive, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
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
            .pipe(takeUntilDestroyed(this), filter(function () { return _this.formGroup.valid; }), tap(function (value) { return _this.dataOutput.emit(value); }))
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXJvb3QtZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvbmd4LXJvb3QtZm9ybS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN4SCxPQUFPLE9BQU8sTUFBTSxpQkFBaUIsQ0FBQztBQUN0QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDN0UsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFcEUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBSWhEO0lBQ1Usd0NBQXlEO0lBaUJqRSx5REFBeUQ7SUFDekQsOEVBQThFO0lBQzlFLDhCQUFZLEVBQXFCO1FBQWpDLFlBQ0UsaUJBQU8sU0FTUjtRQXhCRCxvRUFBb0U7UUFDcEUsbURBQW1EO1FBQ25ELGdCQUFnQjtRQUNOLGtCQUFZLEdBQThCLElBQUksT0FBTyxFQUFFLENBQUM7UUFFeEQsNEJBQXNCLEdBQUcsS0FBSyxDQUFDO1FBQy9CLHVCQUFpQixHQUFHLEtBQUssQ0FBQztRQUUxQixlQUFTLEdBQTRCLElBQUksQ0FBQztRQUU1QywwQkFBb0IsR0FBRyxLQUFLLENBQUM7UUFNbkMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFlBQVksQ0FBa0MsRUFBRSxDQUdwRSxDQUFDO1FBRUYsSUFBSSxFQUFFLEVBQUU7WUFDTixLQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDOztJQUNILENBQUM7SUFFTSx1Q0FBUSxHQUFmO1FBQUEsaUJBYUM7UUFaQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7U0FDbEM7UUFFRCxJQUFJLENBQUMsWUFBWTthQUNkLElBQUksQ0FDSCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFDeEIsTUFBTSxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBcEIsQ0FBb0IsQ0FBQyxFQUNsQyxHQUFHLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBM0IsQ0FBMkIsQ0FBQyxDQUMxQzthQUNBLFNBQVMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCwwQ0FBVyxHQUFYLFVBQVksT0FBc0I7UUFDaEMsaUJBQU0sV0FBVyxZQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFDbkMsQ0FBQztJQUVELGtDQUFrQztJQUNsQywwQ0FBVyxHQUFYLGNBQXFCLENBQUM7SUFFdEIsZ0JBQWdCO0lBQ04scURBQXNCLEdBQWhDLFVBQWlDLElBQTZCO1FBQzVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0QsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVTLG1EQUFvQixHQUE5QixVQUNFLEdBQTRCLEVBQzVCLGFBQTRDO1FBRTVDLE9BQVEsR0FBZ0MsQ0FBQztJQUMzQyxDQUFDO0lBRVMscURBQXNCLEdBQWhDLFVBQWlDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBeUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0seUNBQVUsR0FBakI7UUFDRSw4QkFBOEI7UUFDOUIsa0RBQWtEO1FBQ2xELDRDQUE0QztRQUM1QyxJQUFJO1FBQ0osSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQWdDLENBQUM7UUFDakUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUM5RCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDOztnQkFqRWUsaUJBQWlCOztJQXBCYixvQkFBb0I7UUFGekMsU0FBUyxFQUFFO1FBQ1osbURBQW1EOzt5Q0FxQmpDLGlCQUFpQjtPQXBCYixvQkFBb0IsQ0FzRnpDO0lBQUQsMkJBQUM7Q0FBQSxBQXRGRCxDQUNVLHdCQUF3QixHQXFGakM7U0F0RnFCLG9CQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdG9yUmVmLCBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIE9uSW5pdCwgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgaXNFcXVhbCBmcm9tICdmYXN0LWRlZXAtZXF1YWwnO1xyXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IGZpbHRlciwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5cclxuaW1wb3J0IHsgaXNOdWxsT3JVbmRlZmluZWQsIHRha2VVbnRpbERlc3Ryb3llZCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50IH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50JztcclxuaW1wb3J0IHsgVHlwZWRTdWJGb3JtR3JvdXAgfSBmcm9tICcuL25neC1zdWItZm9ybS50eXBlcyc7XHJcbmltcG9ydCB7IFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4Um9vdEZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgZXh0ZW5kcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBPbkNoYW5nZXMge1xyXG4gIHB1YmxpYyBhYnN0cmFjdCBkYXRhSW5wdXQ6IFJlcXVpcmVkPENvbnRyb2xJbnRlcmZhY2U+IHwgbnVsbCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgcHVibGljIGFic3RyYWN0IGRhdGFPdXRwdXQ6IEV2ZW50RW1pdHRlcjxDb250cm9sSW50ZXJmYWNlPjtcclxuICAvLyB1c2luZyBhIHByaXZhdGUgdmFyaWFibGUgYF9kYXRhT3V0cHV0JGAgdG8gYmUgYWJsZSB0byBjb250cm9sIHRoZVxyXG4gIC8vIGVtaXNzaW9uIHJhdGUgd2l0aCBhIGRlYm91bmNlIG9yIHRocm90dGxlIGZvciBleFxyXG4gIC8qKiBAaW50ZXJuYWwgKi9cclxuICBwcm90ZWN0ZWQgX2RhdGFPdXRwdXQkOiBTdWJqZWN0PENvbnRyb2xJbnRlcmZhY2U+ID0gbmV3IFN1YmplY3QoKTtcclxuXHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSBmYWxzZTtcclxuICBwcm90ZWN0ZWQgZW1pdE51bGxPbkRlc3Ryb3kgPSBmYWxzZTtcclxuXHJcbiAgcHJvdGVjdGVkIGRhdGFWYWx1ZTogQ29udHJvbEludGVyZmFjZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICBwcml2YXRlIGZvcm1Hcm91cEluaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG4gIC8vIGNoYW5nZSBkZXRlY3RvciBvbmx5IG5lZWRzIHRvIGJlIHBhc3NlZCBmcm9tIHJvb3QgZm9ybVxyXG4gIC8vIGZvciBzdWIgZm9ybXMgdGhlIHN1Yi1mb3JtLWRpcmVjdGl2ZSBpbmplY3RzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgcmVmIGZvciB1c1xyXG4gIGNvbnN0cnVjdG9yKGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuZm9ybUdyb3VwID0gbmV3IFN1YkZvcm1Hcm91cDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPih7fSkgYXMgVHlwZWRTdWJGb3JtR3JvdXA8XHJcbiAgICAgIENvbnRyb2xJbnRlcmZhY2UsXHJcbiAgICAgIEZvcm1JbnRlcmZhY2VcclxuICAgID47XHJcblxyXG4gICAgaWYgKGNkKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldENoYW5nZURldGVjdG9yKGNkKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5mb3JtR3JvdXBJbml0aWFsaXplZCkge1xyXG4gICAgICB0aGlzLl9pbml0aWFsaXplRm9ybUdyb3VwKCk7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwSW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2RhdGFPdXRwdXQkXHJcbiAgICAgIC5waXBlKFxyXG4gICAgICAgIHRha2VVbnRpbERlc3Ryb3llZCh0aGlzKSxcclxuICAgICAgICBmaWx0ZXIoKCkgPT4gdGhpcy5mb3JtR3JvdXAudmFsaWQpLFxyXG4gICAgICAgIHRhcCh2YWx1ZSA9PiB0aGlzLmRhdGFPdXRwdXQuZW1pdCh2YWx1ZSkpLFxyXG4gICAgICApXHJcbiAgICAgIC5zdWJzY3JpYmUoKTtcclxuICB9XHJcblxyXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcclxuICAgIHN1cGVyLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xyXG4gICAgdGhpcy5mb3JtR3JvdXBJbml0aWFsaXplZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBuZWVkZWQgZm9yIHRha2UgdW50aWwgZGVzdHJveWVkXHJcbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7fVxyXG5cclxuICAvKiogQGludGVybmFsICovXHJcbiAgcHJvdGVjdGVkIG9uUmVnaXN0ZXJPbkNoYW5nZUhvb2soZGF0YTogQ29udHJvbEludGVyZmFjZSB8IG51bGwpOiBib29sZWFuIHtcclxuICAgIGlmICh0aGlzLmZvcm1Hcm91cC5pbnZhbGlkIHx8IGlzRXF1YWwoZGF0YSwgdGhpcy5kYXRhSW5wdXQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRhdGFWYWx1ZSA9IGRhdGE7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm1Ub0Zvcm1Hcm91cChcclxuICAgIG9iajogQ29udHJvbEludGVyZmFjZSB8IG51bGwsXHJcbiAgICBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCxcclxuICApOiBGb3JtSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKG9iaiBhcyB1bmtub3duKSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgdW5rbm93bikgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBtYW51YWxTYXZlKCk6IHZvaWQge1xyXG4gICAgLy8gaWYgKHRoaXMuZm9ybUdyb3VwLnZhbGlkKSB7XHJcbiAgICAvLyAgIHRoaXMuZGF0YVZhbHVlID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbFZhbHVlO1xyXG4gICAgLy8gICB0aGlzLl9kYXRhT3V0cHV0JC5uZXh0KHRoaXMuZGF0YVZhbHVlKTtcclxuICAgIC8vIH1cclxuICAgIHRoaXMuZGF0YVZhbHVlID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbFZhbHVlIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKHRoaXMuZGF0YVZhbHVlKSAmJiB0aGlzLmZvcm1Hcm91cC52YWxpZCkge1xyXG4gICAgICB0aGlzLl9kYXRhT3V0cHV0JC5uZXh0KHRoaXMuZGF0YVZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19