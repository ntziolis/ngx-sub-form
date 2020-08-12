import { __decorate, __extends } from "tslib";
import { Directive } from '@angular/core';
import { NgxRootFormComponent } from './ngx-root-form.component';
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
        Directive()
        // tslint:disable-next-line: directive-class-suffix
    ], NgxAutomaticRootFormComponent);
    return NgxAutomaticRootFormComponent;
}(NgxRootFormComponent));
export { NgxAutomaticRootFormComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWF1dG9tYXRpYy1yb290LWZvcm0uY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL25neC1hdXRvbWF0aWMtcm9vdC1mb3JtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFVLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNsRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUlqRTtJQUNVLGlEQUFxRDtJQUYvRCxtREFBbUQ7SUFDbkQ7O0lBbUJBLENBQUM7SUFoQkMsZ0JBQWdCO0lBQ04sOERBQXNCLEdBQWhDLFVBQWlDLElBQTZCO1FBQzVELElBQUksQ0FBQyxpQkFBTSxzQkFBc0IsWUFBQyxJQUFJLENBQUMsRUFBRTtZQUN2QyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFaEMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRTtnQkFDeEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQ25CO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFsQm1CLDZCQUE2QjtRQUZsRCxTQUFTLEVBQUU7UUFDWixtREFBbUQ7T0FDN0IsNkJBQTZCLENBbUJsRDtJQUFELG9DQUFDO0NBQUEsQUFuQkQsQ0FDVSxvQkFBb0IsR0FrQjdCO1NBbkJxQiw2QkFBNkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbkluaXQsIERpcmVjdGl2ZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBOZ3hSb290Rm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbmd4LXJvb3QtZm9ybS5jb21wb25lbnQnO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4QXV0b21hdGljUm9vdEZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgZXh0ZW5kcyBOZ3hSb290Rm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPlxyXG4gIGltcGxlbWVudHMgT25Jbml0IHtcclxuICAvKiogQGludGVybmFsICovXHJcbiAgcHJvdGVjdGVkIG9uUmVnaXN0ZXJPbkNoYW5nZUhvb2soZGF0YTogQ29udHJvbEludGVyZmFjZSB8IG51bGwpIHtcclxuICAgIGlmICghc3VwZXIub25SZWdpc3Rlck9uQ2hhbmdlSG9vayhkYXRhKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLm1hcmtBc1ByaXN0aW5lKCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAudmFsaWQpIHtcclxuICAgICAgICB0aGlzLm1hbnVhbFNhdmUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG4iXX0=