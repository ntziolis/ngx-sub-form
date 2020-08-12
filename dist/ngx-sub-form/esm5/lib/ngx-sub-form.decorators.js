import { __extends } from "tslib";
var DataInputUsedOnWrongPropertyError = /** @class */ (function (_super) {
    __extends(DataInputUsedOnWrongPropertyError, _super);
    function DataInputUsedOnWrongPropertyError(calledOnPropertyKey) {
        return _super.call(this, "You're trying to apply the \"DataInput\" decorator on a property called \"" + calledOnPropertyKey + "\". That decorator should only be used on a property called \"dataInput\"") || this;
    }
    return DataInputUsedOnWrongPropertyError;
}(Error));
export { DataInputUsedOnWrongPropertyError };
export function DataInput() {
    return function (target, propertyKey) {
        if (propertyKey !== 'dataInput') {
            throw new DataInputUsedOnWrongPropertyError(propertyKey);
        }
        Object.defineProperty(target, propertyKey, {
            set: function (dataInputValue) {
                this.dataInputUpdated(dataInputValue);
            },
        });
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmRlY29yYXRvcnMuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtc3ViLWZvcm0vIiwic291cmNlcyI6WyJsaWIvbmd4LXN1Yi1mb3JtLmRlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBO0lBQXVELHFEQUFLO0lBQzFELDJDQUFZLG1CQUEyQjtlQUNyQyxrQkFDRSwrRUFBMEUsbUJBQW1CLDhFQUF3RSxDQUN0SztJQUNILENBQUM7SUFDSCx3Q0FBQztBQUFELENBQUMsQUFORCxDQUF1RCxLQUFLLEdBTTNEOztBQUVELE1BQU0sVUFBVSxTQUFTO0lBQ3ZCLE9BQU8sVUFDTCxNQUE2RCxFQUM3RCxXQUFtQjtRQUVuQixJQUFJLFdBQVcsS0FBSyxXQUFXLEVBQUU7WUFDL0IsTUFBTSxJQUFJLGlDQUFpQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzFEO1FBRUQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFO1lBQ3pDLEdBQUcsRUFBRSxVQUFTLGNBQWM7Z0JBQ3pCLElBQThELENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkcsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ3hSb290Rm9ybUNvbXBvbmVudCB9IGZyb20gJy4vbmd4LXJvb3QtZm9ybS5jb21wb25lbnQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFJbnB1dFVzZWRPbldyb25nUHJvcGVydHlFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihjYWxsZWRPblByb3BlcnR5S2V5OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKFxyXG4gICAgICBgWW91J3JlIHRyeWluZyB0byBhcHBseSB0aGUgXCJEYXRhSW5wdXRcIiBkZWNvcmF0b3Igb24gYSBwcm9wZXJ0eSBjYWxsZWQgXCIke2NhbGxlZE9uUHJvcGVydHlLZXl9XCIuIFRoYXQgZGVjb3JhdG9yIHNob3VsZCBvbmx5IGJlIHVzZWQgb24gYSBwcm9wZXJ0eSBjYWxsZWQgXCJkYXRhSW5wdXRcImAsXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIERhdGFJbnB1dCgpIHtcclxuICByZXR1cm4gZnVuY3Rpb248Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+KFxyXG4gICAgdGFyZ2V0OiBOZ3hSb290Rm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPixcclxuICAgIHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcbiAgKSB7XHJcbiAgICBpZiAocHJvcGVydHlLZXkgIT09ICdkYXRhSW5wdXQnKSB7XHJcbiAgICAgIHRocm93IG5ldyBEYXRhSW5wdXRVc2VkT25Xcm9uZ1Byb3BlcnR5RXJyb3IocHJvcGVydHlLZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XHJcbiAgICAgIHNldDogZnVuY3Rpb24oZGF0YUlucHV0VmFsdWUpIHtcclxuICAgICAgICAodGhpcyBhcyBOZ3hSb290Rm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPikuZGF0YUlucHV0VXBkYXRlZChkYXRhSW5wdXRWYWx1ZSk7XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9O1xyXG59XHJcbiJdfQ==