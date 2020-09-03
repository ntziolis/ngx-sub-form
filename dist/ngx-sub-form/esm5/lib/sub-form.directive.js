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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL3N1Yi1mb3JtLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFLaEQ7SUFHRSwwQkFBb0IsRUFBcUI7UUFBckIsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7SUFBRyxDQUFDO0lBQzdDLHNDQUFXLEdBQVgsVUFBWSxPQUFzQjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUM7O2dCQUx1QixpQkFBaUI7O0lBRmhDO1FBQVIsS0FBSyxFQUFFO2tDQUFXLFlBQVk7cURBQWtCO0lBRHRDLGdCQUFnQjtRQUg1QixTQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsV0FBVztTQUN0QixDQUFDO3lDQUl3QixpQkFBaUI7T0FIOUIsZ0JBQWdCLENBUzVCO0lBQUQsdUJBQUM7Q0FBQSxBQVRELElBU0M7U0FUWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDaGFuZ2VEZXRlY3RvclJlZiwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vc3ViLWZvcm0tZ3JvdXAnO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbc3ViRm9ybV0nLFxufSlcbmV4cG9ydCBjbGFzcyBTdWJGb3JtRGlyZWN0aXZlPFRDb250cm9sLCBURm9ybT4gaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBASW5wdXQoKSBzdWJGb3JtITogU3ViRm9ybUdyb3VwPFRDb250cm9sLCBURm9ybT47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHt9XG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlcy5zdWJGb3JtICYmIHRoaXMuc3ViRm9ybSkge1xuICAgICAgdGhpcy5zdWJGb3JtLnNldENoYW5nZURldGVjdG9yKHRoaXMuY2QpO1xuICAgIH1cbiAgfVxufVxuIl19