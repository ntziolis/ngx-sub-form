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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ViLWZvcm0uZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vbmd4LXN1Yi1mb3JtLyIsInNvdXJjZXMiOlsibGliL3N1Yi1mb3JtLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU5RixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFLaEQsSUFBYSxnQkFBZ0IsR0FBN0IsTUFBYSxnQkFBZ0I7SUFHM0IsWUFBb0IsRUFBcUI7UUFBckIsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7SUFBRyxDQUFDO0lBQzdDLFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUM7Q0FDRixDQUFBOztZQU55QixpQkFBaUI7O0FBRmhDO0lBQVIsS0FBSyxFQUFFOzhCQUFXLFlBQVk7aURBQWtCO0FBRHRDLGdCQUFnQjtJQUg1QixTQUFTLENBQUM7UUFDVCxRQUFRLEVBQUUsV0FBVztLQUN0QixDQUFDO3FDQUl3QixpQkFBaUI7R0FIOUIsZ0JBQWdCLENBUzVCO1NBVFksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0b3JSZWYsIERpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlcyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5cclxuaW1wb3J0IHsgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG5ARGlyZWN0aXZlKHtcclxuICBzZWxlY3RvcjogJ1tzdWJGb3JtXScsXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBTdWJGb3JtRGlyZWN0aXZlPFRDb250cm9sLCBURm9ybT4gaW1wbGVtZW50cyBPbkNoYW5nZXMge1xyXG4gIEBJbnB1dCgpIHN1YkZvcm0hOiBTdWJGb3JtR3JvdXA8VENvbnRyb2wsIFRGb3JtPjtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHt9XHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgaWYgKGNoYW5nZXMuc3ViRm9ybSAmJiB0aGlzLnN1YkZvcm0pIHtcclxuICAgICAgdGhpcy5zdWJGb3JtLnNldENoYW5nZURldGVjdG9yKHRoaXMuY2QpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=