import { __decorate, __metadata } from "tslib";
import { ChangeDetectorRef, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SubFormGroup } from './sub-form-group';
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
        { type: ChangeDetectorRef }
    ]; };
    __decorate([
        Input(),
        __metadata("design:type", SubFormGroup)
    ], SubFormDirective.prototype, "subForm", void 0);
    SubFormDirective = __decorate([
        Directive({
            selector: '[subForm]',
        }),
        __metadata("design:paramtypes", [ChangeDetectorRef])
    ], SubFormDirective);
    return SubFormDirective;
}());
export { SubFormDirective };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL3N1Yi1mb3JtLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFLaEQ7SUFHRSwwQkFBb0IsRUFBcUI7UUFBckIsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7SUFBRyxDQUFDO0lBQzdDLHNDQUFXLEdBQVgsVUFBWSxPQUFzQjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUM7O2dCQUx1QixpQkFBaUI7O0lBRmhDO1FBQVIsS0FBSyxFQUFFO2tDQUFXLFlBQVk7cURBQWtCO0lBRHRDLGdCQUFnQjtRQUg1QixTQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsV0FBVztTQUN0QixDQUFDO3lDQUl3QixpQkFBaUI7T0FIOUIsZ0JBQWdCLENBUzVCO0lBQUQsdUJBQUM7Q0FBQSxBQVRELElBU0M7U0FUWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3RvclJlZiwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcblxyXG5pbXBvcnQgeyBTdWJGb3JtR3JvdXAgfSBmcm9tICcuL3N1Yi1mb3JtLWdyb3VwJztcclxuXHJcbkBEaXJlY3RpdmUoe1xyXG4gIHNlbGVjdG9yOiAnW3N1YkZvcm1dJyxcclxufSlcclxuZXhwb3J0IGNsYXNzIFN1YkZvcm1EaXJlY3RpdmU8VENvbnRyb2wsIFRGb3JtPiBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XHJcbiAgQElucHV0KCkgc3ViRm9ybSE6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+O1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge31cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBpZiAoY2hhbmdlcy5zdWJGb3JtICYmIHRoaXMuc3ViRm9ybSkge1xyXG4gICAgICB0aGlzLnN1YkZvcm0uc2V0Q2hhbmdlRGV0ZWN0b3IodGhpcy5jZCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==