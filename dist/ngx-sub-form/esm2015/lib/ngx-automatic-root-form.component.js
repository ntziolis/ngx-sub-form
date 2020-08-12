import { __decorate } from "tslib";
import { Directive } from '@angular/core';
import { NgxRootFormComponent } from './ngx-root-form.component';
let NgxAutomaticRootFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxAutomaticRootFormComponent extends NgxRootFormComponent {
    /** @internal */
    onRegisterOnChangeHook(data) {
        if (!super.onRegisterOnChangeHook(data)) {
            return false;
        }
        if (this.formGroup) {
            this.formGroup.markAsPristine();
            if (this.formGroup.valid) {
                this.manualSave();
            }
        }
        return true;
    }
};
NgxAutomaticRootFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxAutomaticRootFormComponent);
export { NgxAutomaticRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWF1dG9tYXRpYy1yb290LWZvcm0uY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL25neC1hdXRvbWF0aWMtcm9vdC1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFVLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNsRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUlqRSxJQUFzQiw2QkFBNkI7QUFEbkQsbURBQW1EO0FBQ25ELE1BQXNCLDZCQUNwQixTQUFRLG9CQUFxRDtJQUU3RCxnQkFBZ0I7SUFDTixzQkFBc0IsQ0FBQyxJQUE2QjtRQUM1RCxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUVoQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO2dCQUN4QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7YUFDbkI7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGLENBQUE7QUFuQnFCLDZCQUE2QjtJQUZsRCxTQUFTLEVBQUU7SUFDWixtREFBbUQ7R0FDN0IsNkJBQTZCLENBbUJsRDtTQW5CcUIsNkJBQTZCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT25Jbml0LCBEaXJlY3RpdmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgTmd4Um9vdEZvcm1Db21wb25lbnQgfSBmcm9tICcuL25neC1yb290LWZvcm0uY29tcG9uZW50JztcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neEF1dG9tYXRpY1Jvb3RGb3JtQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2UgPSBDb250cm9sSW50ZXJmYWNlPlxyXG4gIGV4dGVuZHMgTmd4Um9vdEZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uSW5pdCB7XHJcbiAgLyoqIEBpbnRlcm5hbCAqL1xyXG4gIHByb3RlY3RlZCBvblJlZ2lzdGVyT25DaGFuZ2VIb29rKGRhdGE6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsKSB7XHJcbiAgICBpZiAoIXN1cGVyLm9uUmVnaXN0ZXJPbkNoYW5nZUhvb2soZGF0YSkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5tYXJrQXNQcmlzdGluZSgpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLnZhbGlkKSB7XHJcbiAgICAgICAgdGhpcy5tYW51YWxTYXZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuIl19