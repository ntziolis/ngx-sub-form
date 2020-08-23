// The following code is copied from angular source since those methods tehy are not exported
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Validators, } from '@angular/forms';
// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/directives/shared.ts
function composeValidators(validators) {
    return validators != null ? Validators.compose(validators.map(normalizeValidator)) : null;
}
function composeAsyncValidators(validators) {
    return validators != null ? Validators.composeAsync(validators.map(normalizeAsyncValidator)) : null;
}
function normalizeValidator(validator) {
    // thorws error in latest typescript version
    //if ((<Validator>validator).validate) {
    if (validator.validate) {
        return function (c) { return validator.validate(c); };
    }
    else {
        return validator;
    }
}
function normalizeAsyncValidator(validator) {
    // thorws error in latest typescript version
    //if ((<AsyncValidator>validator).validate) {
    if (validator.validate) {
        return function (c) { return validator.validate(c); };
    }
    else {
        return validator;
    }
}
// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/model.ts
function isOptionsObj(validatorOrOpts) {
    return validatorOrOpts != null && !Array.isArray(validatorOrOpts) && typeof validatorOrOpts === 'object';
}
export function coerceToValidator(validatorOrOpts) {
    var validator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.validators
        : validatorOrOpts);
    return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
export function coerceToAsyncValidator(asyncValidator, validatorOrOpts) {
    var origAsyncValidator = (isOptionsObj(validatorOrOpts)
        ? validatorOrOpts.asyncValidators
        : asyncValidator);
    return Array.isArray(origAsyncValidator) ? composeAsyncValidators(origAsyncValidator) : origAsyncValidator || null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3QtY29udHJvbC11dGlscy5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9hYnN0cmFjdC1jb250cm9sLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZGQUE2RjtBQUM3Rjs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBTUwsVUFBVSxHQUVYLE1BQU0sZ0JBQWdCLENBQUM7QUFFeEIsMkhBQTJIO0FBQzNILFNBQVMsaUJBQWlCLENBQUMsVUFBMEM7SUFDbkUsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDNUYsQ0FBQztBQUNELFNBQVMsc0JBQXNCLENBQUMsVUFBb0Q7SUFDbEYsT0FBTyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdEcsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsU0FBa0M7SUFDNUQsNENBQTRDO0lBQzVDLHdDQUF3QztJQUN4QyxJQUFVLFNBQVUsQ0FBQyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxVQUFDLENBQWtCLElBQUssT0FBWSxTQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFsQyxDQUFrQyxDQUFDO0tBQ25FO1NBQU07UUFDTCxPQUFvQixTQUFTLENBQUM7S0FDL0I7QUFDSCxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxTQUE0QztJQUMzRSw0Q0FBNEM7SUFDNUMsNkNBQTZDO0lBQzdDLElBQVUsU0FBVSxDQUFDLFFBQVEsRUFBRTtRQUM3QixPQUFPLFVBQUMsQ0FBa0IsSUFBSyxPQUFpQixTQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUF2QyxDQUF1QyxDQUFDO0tBQ3hFO1NBQU07UUFDTCxPQUF5QixTQUFTLENBQUM7S0FDcEM7QUFDSCxDQUFDO0FBRUQsK0dBQStHO0FBQy9HLFNBQVMsWUFBWSxDQUFDLGVBQTZFO0lBQ2pHLE9BQU8sZUFBZSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksT0FBTyxlQUFlLEtBQUssUUFBUSxDQUFDO0FBQzNHLENBQUM7QUFDRCxNQUFNLFVBQVUsaUJBQWlCLENBQy9CLGVBQTZFO0lBRTdFLElBQU0sU0FBUyxHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQztRQUM5QyxDQUFDLENBQUUsZUFBMEMsQ0FBQyxVQUFVO1FBQ3hELENBQUMsQ0FBQyxlQUFlLENBQXVDLENBQUM7SUFFM0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQztBQUNyRixDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUNwQyxjQUE2RCxFQUM3RCxlQUE2RTtJQUU3RSxJQUFNLGtCQUFrQixHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQztRQUN2RCxDQUFDLENBQUUsZUFBMEMsQ0FBQyxlQUFlO1FBQzdELENBQUMsQ0FBQyxjQUFjLENBQStDLENBQUM7SUFFbEUsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQztBQUNySCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIGZvbGxvd2luZyBjb2RlIGlzIGNvcGllZCBmcm9tIGFuZ3VsYXIgc291cmNlIHNpbmNlIHRob3NlIG1ldGhvZHMgdGVoeSBhcmUgbm90IGV4cG9ydGVkXHJcbi8qKlxyXG4gKiBAbGljZW5zZVxyXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICpcclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcclxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxyXG4gKi9cclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2xPcHRpb25zLFxyXG4gIEFzeW5jVmFsaWRhdG9yLFxyXG4gIEFzeW5jVmFsaWRhdG9yRm4sXHJcbiAgVmFsaWRhdG9yLFxyXG4gIFZhbGlkYXRvckZuLFxyXG4gIFZhbGlkYXRvcnMsXHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuXHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi8wMDc1MDE3YjQzYTM3ZDA2NzgwY2MyNDVjMzMyNjIxMmQxNWZkNmJkL3BhY2thZ2VzL2Zvcm1zL3NyYy9kaXJlY3RpdmVzL3NoYXJlZC50c1xyXG5mdW5jdGlvbiBjb21wb3NlVmFsaWRhdG9ycyh2YWxpZGF0b3JzOiBBcnJheTxWYWxpZGF0b3IgfCBWYWxpZGF0b3JGbj4pOiBWYWxpZGF0b3JGbiB8IG51bGwge1xyXG4gIHJldHVybiB2YWxpZGF0b3JzICE9IG51bGwgPyBWYWxpZGF0b3JzLmNvbXBvc2UodmFsaWRhdG9ycy5tYXAobm9ybWFsaXplVmFsaWRhdG9yKSkgOiBudWxsO1xyXG59XHJcbmZ1bmN0aW9uIGNvbXBvc2VBc3luY1ZhbGlkYXRvcnModmFsaWRhdG9yczogQXJyYXk8QXN5bmNWYWxpZGF0b3IgfCBBc3luY1ZhbGlkYXRvckZuPik6IEFzeW5jVmFsaWRhdG9yRm4gfCBudWxsIHtcclxuICByZXR1cm4gdmFsaWRhdG9ycyAhPSBudWxsID8gVmFsaWRhdG9ycy5jb21wb3NlQXN5bmModmFsaWRhdG9ycy5tYXAobm9ybWFsaXplQXN5bmNWYWxpZGF0b3IpKSA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZVZhbGlkYXRvcih2YWxpZGF0b3I6IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yKTogVmFsaWRhdG9yRm4ge1xyXG4gIC8vIHRob3J3cyBlcnJvciBpbiBsYXRlc3QgdHlwZXNjcmlwdCB2ZXJzaW9uXHJcbiAgLy9pZiAoKDxWYWxpZGF0b3I+dmFsaWRhdG9yKS52YWxpZGF0ZSkge1xyXG4gIGlmICgoPGFueT52YWxpZGF0b3IpLnZhbGlkYXRlKSB7XHJcbiAgICByZXR1cm4gKGM6IEFic3RyYWN0Q29udHJvbCkgPT4gKDxWYWxpZGF0b3I+dmFsaWRhdG9yKS52YWxpZGF0ZShjKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIDxWYWxpZGF0b3JGbj52YWxpZGF0b3I7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemVBc3luY1ZhbGlkYXRvcih2YWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvcik6IEFzeW5jVmFsaWRhdG9yRm4ge1xyXG4gIC8vIHRob3J3cyBlcnJvciBpbiBsYXRlc3QgdHlwZXNjcmlwdCB2ZXJzaW9uXHJcbiAgLy9pZiAoKDxBc3luY1ZhbGlkYXRvcj52YWxpZGF0b3IpLnZhbGlkYXRlKSB7XHJcbiAgaWYgKCg8YW55PnZhbGlkYXRvcikudmFsaWRhdGUpIHtcclxuICAgIHJldHVybiAoYzogQWJzdHJhY3RDb250cm9sKSA9PiAoPEFzeW5jVmFsaWRhdG9yPnZhbGlkYXRvcikudmFsaWRhdGUoYyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiA8QXN5bmNWYWxpZGF0b3JGbj52YWxpZGF0b3I7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvMDA3NTAxN2I0M2EzN2QwNjc4MGNjMjQ1YzMzMjYyMTJkMTVmZDZiZC9wYWNrYWdlcy9mb3Jtcy9zcmMvbW9kZWwudHNcclxuZnVuY3Rpb24gaXNPcHRpb25zT2JqKHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIHZhbGlkYXRvck9yT3B0cyAhPSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbGlkYXRvck9yT3B0cykgJiYgdHlwZW9mIHZhbGlkYXRvck9yT3B0cyA9PT0gJ29iamVjdCc7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZVRvVmFsaWRhdG9yKFxyXG4gIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4pOiBWYWxpZGF0b3JGbiB8IG51bGwge1xyXG4gIGNvbnN0IHZhbGlkYXRvciA9IChpc09wdGlvbnNPYmoodmFsaWRhdG9yT3JPcHRzKVxyXG4gICAgPyAodmFsaWRhdG9yT3JPcHRzIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnMpLnZhbGlkYXRvcnNcclxuICAgIDogdmFsaWRhdG9yT3JPcHRzKSBhcyBWYWxpZGF0b3JGbiB8IFZhbGlkYXRvckZuW10gfCBudWxsO1xyXG5cclxuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWxpZGF0b3IpID8gY29tcG9zZVZhbGlkYXRvcnModmFsaWRhdG9yKSA6IHZhbGlkYXRvciB8fCBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihcclxuICBhc3luY1ZhbGlkYXRvcj86IEFzeW5jVmFsaWRhdG9yRm4gfCBBc3luY1ZhbGlkYXRvckZuW10gfCBudWxsLFxyXG4gIHZhbGlkYXRvck9yT3B0cz86IFZhbGlkYXRvckZuIHwgVmFsaWRhdG9yRm5bXSB8IEFic3RyYWN0Q29udHJvbE9wdGlvbnMgfCBudWxsLFxyXG4pOiBBc3luY1ZhbGlkYXRvckZuIHwgbnVsbCB7XHJcbiAgY29uc3Qgb3JpZ0FzeW5jVmFsaWRhdG9yID0gKGlzT3B0aW9uc09iaih2YWxpZGF0b3JPck9wdHMpXHJcbiAgICA/ICh2YWxpZGF0b3JPck9wdHMgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucykuYXN5bmNWYWxpZGF0b3JzXHJcbiAgICA6IGFzeW5jVmFsaWRhdG9yKSBhcyBBc3luY1ZhbGlkYXRvckZuIHwgQXN5bmNWYWxpZGF0b3JGbiB8IG51bGw7XHJcblxyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KG9yaWdBc3luY1ZhbGlkYXRvcikgPyBjb21wb3NlQXN5bmNWYWxpZGF0b3JzKG9yaWdBc3luY1ZhbGlkYXRvcikgOiBvcmlnQXN5bmNWYWxpZGF0b3IgfHwgbnVsbDtcclxufVxyXG4iXX0=