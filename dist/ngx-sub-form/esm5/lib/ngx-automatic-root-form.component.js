import { __decorate, __extends, __metadata, __read } from "tslib";
import { ChangeDetectorRef, Directive, OnDestroy, OnInit, Optional } from '@angular/core';
import { combineLatest } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';
import { NgxRootFormComponent } from './ngx-root-form.component';
import { takeUntilDestroyed } from './ngx-sub-form-utils';
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
export { NgxAutomaticRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWF1dG9tYXRpYy1yb290LWZvcm0uY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL25neC1hdXRvbWF0aWMtcm9vdC1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMxRixPQUFPLEVBQUUsYUFBYSxFQUFjLE1BQU0sTUFBTSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRXhELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ2pFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBTTFEO0lBQ1UsaURBQXFEO0lBRTdELHVDQUFZLEVBQXFCO2VBQy9CLGtCQUFNLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRCxnREFBUSxHQUFSO1FBQUEsaUJBY0M7UUFiQyxpQkFBTSxRQUFRLFdBQUUsQ0FBQztRQUVqQixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQWdDLENBQUM7UUFFbkgsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFakYsYUFBYSxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQzdCLElBQUksQ0FDSCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFDeEIsTUFBTSxDQUFDLFVBQUMsRUFBZTtnQkFBZixrQkFBZSxFQUFkLGNBQU0sRUFBRSxhQUFLO1lBQU0sT0FBQSxNQUFNLEtBQUssT0FBTztRQUFsQixDQUFrQixDQUFDLEVBQy9DLEdBQUcsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFVBQVUsRUFBRSxFQUFqQixDQUFpQixDQUFDLENBQzdCO2FBQ0EsU0FBUyxFQUFFLENBQUM7SUFDakIsQ0FBQzs7Z0JBbEJlLGlCQUFpQjs7SUFIYiw2QkFBNkI7UUFGbEQsU0FBUyxFQUFFO1FBQ1osbURBQW1EOzt5Q0FJakMsaUJBQWlCO09BSGIsNkJBQTZCLENBc0JsRDtJQUFELG9DQUFDO0NBQUEsQUF0QkQsQ0FDVSxvQkFBb0IsR0FxQjdCO1NBdEJxQiw2QkFBNkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3RvclJlZiwgRGlyZWN0aXZlLCBPbkRlc3Ryb3ksIE9uSW5pdCwgT3B0aW9uYWwgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgY29tYmluZUxhdGVzdCwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBmaWx0ZXIsIHN0YXJ0V2l0aCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5cclxuaW1wb3J0IHsgTmd4Um9vdEZvcm1Db21wb25lbnQgfSBmcm9tICcuL25neC1yb290LWZvcm0uY29tcG9uZW50JztcclxuaW1wb3J0IHsgdGFrZVVudGlsRGVzdHJveWVkIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5cclxudHlwZSBGb3JtR3JvdXBTdGF0dXMgPSAnRElTQUJMRUQnIHwgJ1BFTkRJTkcnIHwgJ0lOVkFMSUQnIHwgJ1ZBTElEJztcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neEF1dG9tYXRpY1Jvb3RGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGV4dGVuZHMgTmd4Um9vdEZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcclxuICBjb25zdHJ1Y3RvcihjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcclxuICAgIHN1cGVyKGNkKTtcclxuICB9XHJcblxyXG4gIG5nT25Jbml0KCkge1xyXG4gICAgc3VwZXIubmdPbkluaXQoKTtcclxuXHJcbiAgICBjb25zdCBzdGF0dXMkID0gdGhpcy5mb3JtR3JvdXAuc3RhdHVzQ2hhbmdlcy5waXBlKHN0YXJ0V2l0aCh0aGlzLmZvcm1Hcm91cC5zdGF0dXMpKSBhcyBPYnNlcnZhYmxlPEZvcm1Hcm91cFN0YXR1cz47XHJcblxyXG4gICAgY29uc3QgdmFsdWUkID0gdGhpcy5mb3JtR3JvdXAudmFsdWVDaGFuZ2VzLnBpcGUoc3RhcnRXaXRoKHRoaXMuZm9ybUdyb3VwLnZhbHVlKSk7XHJcblxyXG4gICAgY29tYmluZUxhdGVzdChbc3RhdHVzJCwgdmFsdWUkXSlcclxuICAgICAgLnBpcGUoXHJcbiAgICAgICAgdGFrZVVudGlsRGVzdHJveWVkKHRoaXMpLFxyXG4gICAgICAgIGZpbHRlcigoW3N0YXR1cywgdmFsdWVdKSA9PiBzdGF0dXMgPT09ICdWQUxJRCcpLFxyXG4gICAgICAgIHRhcCgoKSA9PiB0aGlzLm1hbnVhbFNhdmUoKSksXHJcbiAgICAgIClcclxuICAgICAgLnN1YnNjcmliZSgpO1xyXG4gIH1cclxufVxyXG4iXX0=