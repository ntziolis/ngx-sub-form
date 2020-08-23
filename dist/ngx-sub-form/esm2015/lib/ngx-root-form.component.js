import { __decorate, __metadata } from "tslib";
import { ChangeDetectorRef, Directive, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import isEqual from 'fast-deep-equal';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { isNullOrUndefined, takeUntilDestroyed } from './ngx-sub-form-utils';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
import { SubFormGroup } from './sub-form-group';
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
export { NgxRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXJvb3QtZm9ybS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvbmd4LXJvb3QtZm9ybS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN4SCxPQUFPLE9BQU8sTUFBTSxpQkFBaUIsQ0FBQztBQUN0QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDN0UsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFcEUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBSWhELElBQXNCLG9CQUFvQjtBQUQxQyxtREFBbUQ7QUFDbkQsTUFBc0Isb0JBQ3BCLFNBQVEsd0JBQXlEO0lBaUJqRSx5REFBeUQ7SUFDekQsOEVBQThFO0lBQzlFLFlBQVksRUFBcUI7UUFDL0IsS0FBSyxFQUFFLENBQUM7UUFmVixvRUFBb0U7UUFDcEUsbURBQW1EO1FBQ25ELGdCQUFnQjtRQUNOLGlCQUFZLEdBQThCLElBQUksT0FBTyxFQUFFLENBQUM7UUFFeEQsMkJBQXNCLEdBQUcsS0FBSyxDQUFDO1FBQy9CLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUUxQixjQUFTLEdBQTRCLElBQUksQ0FBQztRQUU1Qyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFNbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFlBQVksQ0FBa0MsRUFBRSxDQUdwRSxDQUFDO1FBRUYsSUFBSSxFQUFFLEVBQUU7WUFDTixJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDO0lBQ0gsQ0FBQztJQUVNLFFBQVE7UUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7U0FDbEM7UUFFRCxJQUFJLENBQUMsWUFBWTthQUNkLElBQUksQ0FDSCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFDeEIsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQ2xDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQzFDO2FBQ0EsU0FBUyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFDbkMsQ0FBQztJQUVELGtDQUFrQztJQUNsQyxXQUFXLEtBQVUsQ0FBQztJQUV0QixnQkFBZ0I7SUFDTixzQkFBc0IsQ0FBQyxJQUE2QjtRQUM1RCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzNELE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFUyxvQkFBb0IsQ0FDNUIsR0FBNEIsRUFDNUIsYUFBNEM7UUFFNUMsT0FBUSxHQUFnQyxDQUFDO0lBQzNDLENBQUM7SUFFUyxzQkFBc0IsQ0FBQyxTQUF3QjtRQUN2RCxPQUFRLFNBQXlDLENBQUM7SUFDcEQsQ0FBQztJQUVNLFVBQVU7UUFDZiw4QkFBOEI7UUFDOUIsa0RBQWtEO1FBQ2xELDRDQUE0QztRQUM1QyxJQUFJO1FBQ0osSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQWdDLENBQUM7UUFDakUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtZQUM5RCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTs7WUFsRWlCLGlCQUFpQjs7QUFwQmIsb0JBQW9CO0lBRnpDLFNBQVMsRUFBRTtJQUNaLG1EQUFtRDs7cUNBcUJqQyxpQkFBaUI7R0FwQmIsb0JBQW9CLENBc0Z6QztTQXRGcUIsb0JBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0b3JSZWYsIERpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBPbkNoYW5nZXMsIE9uRGVzdHJveSwgT25Jbml0LCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCBpc0VxdWFsIGZyb20gJ2Zhc3QtZGVlcC1lcXVhbCc7XHJcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgZmlsdGVyLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcblxyXG5pbXBvcnQgeyBpc051bGxPclVuZGVmaW5lZCwgdGFrZVVudGlsRGVzdHJveWVkIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5pbXBvcnQgeyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQgfSBmcm9tICcuL25neC1zdWItZm9ybS5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hSb290Rm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBleHRlbmRzIE5neFN1YkZvcm1SZW1hcENvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XHJcbiAgcHVibGljIGFic3RyYWN0IGRhdGFJbnB1dDogUmVxdWlyZWQ8Q29udHJvbEludGVyZmFjZT4gfCBudWxsIHwgdW5kZWZpbmVkO1xyXG5cclxuICBwdWJsaWMgYWJzdHJhY3QgZGF0YU91dHB1dDogRXZlbnRFbWl0dGVyPENvbnRyb2xJbnRlcmZhY2U+O1xyXG4gIC8vIHVzaW5nIGEgcHJpdmF0ZSB2YXJpYWJsZSBgX2RhdGFPdXRwdXQkYCB0byBiZSBhYmxlIHRvIGNvbnRyb2wgdGhlXHJcbiAgLy8gZW1pc3Npb24gcmF0ZSB3aXRoIGEgZGVib3VuY2Ugb3IgdGhyb3R0bGUgZm9yIGV4XHJcbiAgLyoqIEBpbnRlcm5hbCAqL1xyXG4gIHByb3RlY3RlZCBfZGF0YU91dHB1dCQ6IFN1YmplY3Q8Q29udHJvbEludGVyZmFjZT4gPSBuZXcgU3ViamVjdCgpO1xyXG5cclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IGZhbHNlO1xyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IGZhbHNlO1xyXG5cclxuICBwcm90ZWN0ZWQgZGF0YVZhbHVlOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIHByaXZhdGUgZm9ybUdyb3VwSW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gY2hhbmdlIGRldGVjdG9yIG9ubHkgbmVlZHMgdG8gYmUgcGFzc2VkIGZyb20gcm9vdCBmb3JtXHJcbiAgLy8gZm9yIHN1YiBmb3JtcyB0aGUgc3ViLWZvcm0tZGlyZWN0aXZlIGluamVjdHMgdGhlIGNoYW5nZSBkZXRlY3RvciByZWYgZm9yIHVzXHJcbiAgY29uc3RydWN0b3IoY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgdGhpcy5mb3JtR3JvdXAgPSBuZXcgU3ViRm9ybUdyb3VwPENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+KHt9KSBhcyBUeXBlZFN1YkZvcm1Hcm91cDxcclxuICAgICAgQ29udHJvbEludGVyZmFjZSxcclxuICAgICAgRm9ybUludGVyZmFjZVxyXG4gICAgPjtcclxuXHJcbiAgICBpZiAoY2QpIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0Q2hhbmdlRGV0ZWN0b3IoY2QpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cEluaXRpYWxpemVkKSB7XHJcbiAgICAgIHRoaXMuX2luaXRpYWxpemVGb3JtR3JvdXAoKTtcclxuICAgICAgdGhpcy5mb3JtR3JvdXBJbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZGF0YU91dHB1dCRcclxuICAgICAgLnBpcGUoXHJcbiAgICAgICAgdGFrZVVudGlsRGVzdHJveWVkKHRoaXMpLFxyXG4gICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLmZvcm1Hcm91cC52YWxpZCksXHJcbiAgICAgICAgdGFwKHZhbHVlID0+IHRoaXMuZGF0YU91dHB1dC5lbWl0KHZhbHVlKSksXHJcbiAgICAgIClcclxuICAgICAgLnN1YnNjcmliZSgpO1xyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgc3VwZXIubmdPbkNoYW5nZXMoY2hhbmdlcyk7XHJcbiAgICB0aGlzLmZvcm1Hcm91cEluaXRpYWxpemVkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIG5lZWRlZCBmb3IgdGFrZSB1bnRpbCBkZXN0cm95ZWRcclxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHt9XHJcblxyXG4gIC8qKiBAaW50ZXJuYWwgKi9cclxuICBwcm90ZWN0ZWQgb25SZWdpc3Rlck9uQ2hhbmdlSG9vayhkYXRhOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwLmludmFsaWQgfHwgaXNFcXVhbChkYXRhLCB0aGlzLmRhdGFJbnB1dCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGF0YVZhbHVlID0gZGF0YTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIHVua25vd24pIGFzIEZvcm1JbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyB1bmtub3duKSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG1hbnVhbFNhdmUoKTogdm9pZCB7XHJcbiAgICAvLyBpZiAodGhpcy5mb3JtR3JvdXAudmFsaWQpIHtcclxuICAgIC8vICAgdGhpcy5kYXRhVmFsdWUgPSB0aGlzLmZvcm1Hcm91cC5jb250cm9sVmFsdWU7XHJcbiAgICAvLyAgIHRoaXMuX2RhdGFPdXRwdXQkLm5leHQodGhpcy5kYXRhVmFsdWUpO1xyXG4gICAgLy8gfVxyXG4gICAgdGhpcy5kYXRhVmFsdWUgPSB0aGlzLmZvcm1Hcm91cC5jb250cm9sVmFsdWUgYXMgQ29udHJvbEludGVyZmFjZTtcclxuICAgIGlmICghaXNOdWxsT3JVbmRlZmluZWQodGhpcy5kYXRhVmFsdWUpICYmIHRoaXMuZm9ybUdyb3VwLnZhbGlkKSB7XHJcbiAgICAgIHRoaXMuX2RhdGFPdXRwdXQkLm5leHQodGhpcy5kYXRhVmFsdWUpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=