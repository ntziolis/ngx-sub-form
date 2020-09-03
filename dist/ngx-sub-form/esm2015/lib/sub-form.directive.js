import { __decorate, __metadata } from "tslib";
import { ChangeDetectorRef, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SubFormGroup } from './sub-form-group';
let SubFormDirective = class SubFormDirective {
    constructor(cd) {
        this.cd = cd;
    }
    ngOnChanges(changes) {
        if (changes.subForm && this.subForm) {
            this.subForm.setChangeDetector(this.cd);
        }
    }
};
SubFormDirective.ctorParameters = () => [
    { type: ChangeDetectorRef }
];
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
export { SubFormDirective };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL3N1Yi1mb3JtLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFLaEQsSUFBYSxnQkFBZ0IsR0FBN0IsTUFBYSxnQkFBZ0I7SUFHM0IsWUFBb0IsRUFBcUI7UUFBckIsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7SUFBRyxDQUFDO0lBQzdDLFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUM7Q0FDRixDQUFBOztZQU55QixpQkFBaUI7O0FBRmhDO0lBQVIsS0FBSyxFQUFFOzhCQUFXLFlBQVk7aURBQWtCO0FBRHRDLGdCQUFnQjtJQUg1QixTQUFTLENBQUM7UUFDVCxRQUFRLEVBQUUsV0FBVztLQUN0QixDQUFDO3FDQUl3QixpQkFBaUI7R0FIOUIsZ0JBQWdCLENBUzVCO1NBVFksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0b3JSZWYsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBTdWJGb3JtR3JvdXAgfSBmcm9tICcuL3N1Yi1mb3JtLWdyb3VwJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW3N1YkZvcm1dJyxcbn0pXG5leHBvcnQgY2xhc3MgU3ViRm9ybURpcmVjdGl2ZTxUQ29udHJvbCwgVEZvcm0+IGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgc3ViRm9ybSE6IFN1YkZvcm1Hcm91cDxUQ29udHJvbCwgVEZvcm0+O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7fVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXMuc3ViRm9ybSAmJiB0aGlzLnN1YkZvcm0pIHtcbiAgICAgIHRoaXMuc3ViRm9ybS5zZXRDaGFuZ2VEZXRlY3Rvcih0aGlzLmNkKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==