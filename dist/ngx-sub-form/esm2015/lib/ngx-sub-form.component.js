import { __decorate, __metadata } from "tslib";
import { Directive, Input } from '@angular/core';
import { FormArray, FormControl, } from '@angular/forms';
import { coerceToAsyncValidator, coerceToValidator } from './abstract-control-utils';
import { isNullOrUndefined, } from './ngx-sub-form-utils';
import { patchFormControl, SubFormGroup } from './sub-form-group';
let NgxSubFormComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormComponent {
    constructor() {
        // when developing the lib it's a good idea to set the formGroup type
        // to current + `| undefined` to catch a bunch of possible issues
        // see @note form-group-undefined
        this.emitNullOnDestroy = true;
        this.emitInitialValueOnInit = true;
        this.ngOnChangesWasCalled = false;
    }
    get formControlNames() {
        // see @note form-group-undefined for as syntax
        return this.mapControls((_, key) => key, () => true, false);
    }
    ngOnChanges(changes) {
        this.ngOnChangesWasCalled = true;
        if (changes['dataInput'] === undefined && changes['formGroup'] === undefined) {
            return;
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
        Object.keys(this.formGroup.controls).forEach(key => {
            this.formGroup.removeControl(key);
        });
        const subForm = this.formGroup;
        const controls = this.getFormControls();
        for (const key in controls) {
            if (controls.hasOwnProperty(key)) {
                const control = controls[key];
                // we need to wire up the form controls with the sub form group
                // this allows us to transform the sub form value to ControlInterface
                // every time any of the form controls on the sub form change
                if (control instanceof FormControl) {
                    patchFormControl(subForm, control);
                }
                this.formGroup.addControl(key, control);
            }
        }
        // connect sub form group with current sub-form-component
        subForm.setSubForm(this);
        const options = this.getFormGroupControlOptions();
        const validators = [];
        const asyncValidators = [];
        // get validators that were passed into the sub form group on the parent
        if (subForm.parentValidatorOrOpts) {
            const validator = coerceToValidator(subForm.parentValidatorOrOpts);
            if (validator) {
                validators.push(validator);
            }
        }
        // get async validators that were passed into the sub form group on the parent
        if (subForm.parentAsyncValidator) {
            const validator = coerceToAsyncValidator(subForm.parentAsyncValidator);
            if (validator) {
                asyncValidators.push(validator);
            }
        }
        // handle AbstractControlOptions from getFormGroupControlOptions
        if (options) {
            if (options.updateOn) {
                // sadly there is no public metohd that lets us change the update strategy of an already created FormGroup
                this.formGroup._setUpdateStrategy(options.updateOn);
            }
            if (options.validators) {
                const validator = coerceToValidator(options.validators);
                if (validator) {
                    validators.push(validator);
                }
            }
            if (options.asyncValidators) {
                const validator = coerceToAsyncValidator(options.asyncValidators);
                if (validator) {
                    asyncValidators.push(validator);
                }
            }
        }
        // set validators / async validators on sub form group
        if (validators.length > 0) {
            this.formGroup.setValidators(validators);
        }
        if (asyncValidators.length > 0) {
            this.formGroup.setAsyncValidators(asyncValidators);
        }
        // if the form has default values, they should be applied straight away
        const defaultValues = this.getDefaultValues();
        // get default values for reset, if null fallback to undefined as there si a difference when calling reset
        const transformedValue = this.transformFromFormGroup(defaultValues) || undefined;
        // since this is the initial setting of form values do NOT emit an event
        let mergedValues;
        if (Array.isArray(transformedValue)) {
            mergedValues = subForm.controlValue;
        }
        else {
            const controlValue = (changes['dataInput'] ? this['dataInput'] : subForm.controlValue) || {};
            mergedValues = Object.assign(Object.assign({}, transformedValue), controlValue);
        }
        const formValue = this.transformToFormGroup(mergedValues, {});
        this.handleFormArrayControls(formValue);
        // self = false is critical here
        // this allows the parent form to re-evaluate its status after each of its sub form has completed intialization
        // we actually only need to call this on the deepest sub form in a tree (leaves)
        // but there is no way to identify if there are sub forms on the current form + that are also rendered
        // as only when sub forms are rendered the on changes method on the sub form is executed
        // TODO decide if we want to emit an event when input control value != control value after intialization
        // this happens for example when null is passed in but default values change the value of the inner form
        this.formGroup.reset(mergedValues, { onlySelf: false, emitEvent: false });
    }
    ngAfterContentChecked() {
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if (this.ngOnChangesWasCalled && this.formGroup.cd) {
            // if this is the root form
            // OR if ist a sub form but the root form does not have a change detector
            // we need to actually run change detection vs just marking for check
            if (!this.formGroup.parent) {
                this.formGroup.cd.detectChanges();
            }
            else {
                this.formGroup.cd.markForCheck();
            }
        }
    }
    mapControls(mapControl, filterControl = () => true, recursiveIfArray = true) {
        if (!this.formGroup) {
            return null;
        }
        const formControls = this.formGroup.controls;
        const controls = {};
        for (const key in formControls) {
            if (this.formGroup.controls.hasOwnProperty(key)) {
                const control = formControls[key];
                if (recursiveIfArray && control instanceof FormArray) {
                    const values = [];
                    for (let i = 0; i < control.length; i++) {
                        if (filterControl(control.at(i), key, true)) {
                            values.push(mapControl(control.at(i), key));
                        }
                    }
                    if (values.length > 0 && values.some(x => !isNullOrUndefined(x))) {
                        controls[key] = values;
                    }
                }
                else if (control && filterControl(control, key, false)) {
                    controls[key] = mapControl(control, key);
                }
            }
        }
        return controls;
    }
    /**
     * Extend this method to provide custom local FormGroup level validation
     */
    getFormGroupControlOptions() {
        return {};
    }
    // when getDefaultValues is defined, you do not need to specify the default values
    // in your form (the ones defined within the `getFormControls` method)
    getDefaultValues() {
        return {};
    }
    handleFormArrayControls(obj) {
        // TODO check if this can still happen, it appreaded during development. might alerady be fixed
        if (!this.formGroup) {
            return;
        }
        Object.entries(obj).forEach(([key, value]) => {
            if (this.formGroup.get(key) instanceof FormArray && Array.isArray(value)) {
                const formArray = this.formGroup.get(key);
                // instead of creating a new array every time and push a new FormControl
                // we just remove or add what is necessary so that:
                // - it is as efficient as possible and do not create unnecessary FormControl every time
                // - validators are not destroyed/created again and eventually fire again for no reason
                while (formArray.length > value.length) {
                    formArray.removeAt(formArray.length - 1);
                }
                for (let i = formArray.length; i < value.length; i++) {
                    if (this.formIsFormWithArrayControls()) {
                        formArray.insert(i, this.createFormArrayControl(key, value[i]));
                    }
                    else {
                        const control = new FormControl(value[i]);
                        patchFormControl(this.formGroup, control);
                        formArray.insert(i, control);
                    }
                }
            }
        });
    }
    formIsFormWithArrayControls() {
        return typeof this.createFormArrayControl === 'function';
    }
    // when customizing the emission rate of your sub form component, remember not to **mutate** the stream
    // it is safe to throttle, debounce, delay, etc but using skip, first, last or mutating data inside
    // the stream will cause issues!
    handleEmissionRate() {
        return obs$ => obs$;
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformToFormGroup(obj, defaultValues) {
        return obj;
    }
    // that method can be overridden if the
    // shape of the form needs to be modified
    transformFromFormGroup(formValue) {
        return formValue;
    }
};
__decorate([
    Input('subForm'),
    __metadata("design:type", Object)
], NgxSubFormComponent.prototype, "formGroup", void 0);
NgxSubFormComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormComponent);
export { NgxSubFormComponent };
let NgxSubFormRemapComponent = 
// tslint:disable-next-line: directive-class-suffix
class NgxSubFormRemapComponent extends NgxSubFormComponent {
};
NgxSubFormRemapComponent = __decorate([
    Directive()
    // tslint:disable-next-line: directive-class-suffix
], NgxSubFormRemapComponent);
export { NgxSubFormRemapComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDaEMseUJBQW9CLEdBQUcsS0FBSyxDQUFDO0lBbVF2QyxDQUFDO0lBOVBDLElBQVcsZ0JBQWdCO1FBQ3pCLCtDQUErQztRQUMvQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQ3JCLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUNmLEdBQUcsRUFBRSxDQUFDLElBQUksRUFDVixLQUFLLENBQzBCLENBQUM7SUFDcEMsQ0FBQztJQUVELFdBQVcsQ0FBQyxPQUFzQjtRQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVFLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLFlBQVksWUFBWSxDQUFDLEVBQUU7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1NBQ3hFO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFFL0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hDLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFO1lBQzFCLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUU5QiwrREFBK0Q7Z0JBQy9ELHFFQUFxRTtnQkFDckUsNkRBQTZEO2dCQUM3RCxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUU7b0JBQ2xDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDcEM7Z0JBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7UUFFRCx5REFBeUQ7UUFDekQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQTRCLENBQUM7UUFFNUUsTUFBTSxVQUFVLEdBQWtCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLGVBQWUsR0FBdUIsRUFBRSxDQUFDO1FBRS9DLHdFQUF3RTtRQUN4RSxJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRTtZQUNqQyxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNuRSxJQUFJLFNBQVMsRUFBRTtnQkFDYixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzVCO1NBQ0Y7UUFFRCw4RUFBOEU7UUFDOUUsSUFBSSxPQUFPLENBQUMsb0JBQW9CLEVBQUU7WUFDaEMsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDdkUsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNqQztTQUNGO1FBRUQsZ0VBQWdFO1FBQ2hFLElBQUksT0FBTyxFQUFFO1lBQ1gsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO2dCQUNwQiwwR0FBMEc7Z0JBQ3pHLElBQUksQ0FBQyxTQUFpQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM5RDtZQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtnQkFDdEIsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLFNBQVMsRUFBRTtvQkFDYixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUM1QjthQUNGO1lBRUQsSUFBSSxPQUFPLENBQUMsZUFBZSxFQUFFO2dCQUMzQixNQUFNLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2xFLElBQUksU0FBUyxFQUFFO29CQUNiLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQ2pDO2FBQ0Y7U0FDRjtRQUVELHNEQUFzRDtRQUN0RCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsSUFBSSxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsdUVBQXVFO1FBQ3ZFLE1BQU0sYUFBYSxHQUFrQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU3RSwwR0FBMEc7UUFDMUcsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBOEIsQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUNsRyx3RUFBd0U7UUFFeEUsSUFBSSxZQUE4QixDQUFDO1FBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1lBQ25DLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1NBQ3JDO2FBQU07WUFDTCxNQUFNLFlBQVksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUUsSUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RHLFlBQVksR0FBRyxnQ0FBSyxnQkFBZ0IsR0FBSyxZQUFZLENBQXNCLENBQUM7U0FDN0U7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QyxnQ0FBZ0M7UUFDaEMsK0dBQStHO1FBQy9HLGdGQUFnRjtRQUNoRixzR0FBc0c7UUFDdEcsd0ZBQXdGO1FBRXhGLHdHQUF3RztRQUN4Ryx3R0FBd0c7UUFDeEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQscUJBQXFCO1FBQ25CLDBFQUEwRTtRQUMxRSwwRUFBMEU7UUFDMUUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUU7WUFDbEQsMkJBQTJCO1lBQzNCLHlFQUF5RTtZQUN6RSxxRUFBcUU7WUFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUNuQztpQkFBTTtnQkFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQzthQUNsQztTQUNGO0lBQ0gsQ0FBQztJQVVPLFdBQVcsQ0FDakIsVUFBdUQsRUFDdkQsZ0JBQXNELEdBQUcsRUFBRSxDQUFDLElBQUksRUFDaEUsbUJBQTRCLElBQUk7UUFFaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sWUFBWSxHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUUxRSxNQUFNLFFBQVEsR0FBOEQsRUFBRSxDQUFDO1FBRS9FLEtBQUssTUFBTSxHQUFHLElBQUksWUFBWSxFQUFFO1lBQzlCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUMvQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRWxDLElBQUksZ0JBQWdCLElBQUksT0FBTyxZQUFZLFNBQVMsRUFBRTtvQkFDcEQsTUFBTSxNQUFNLEdBQWUsRUFBRSxDQUFDO29CQUU5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFDdkMsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUU7NEJBQzNDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQzt5QkFDN0M7cUJBQ0Y7b0JBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUNoRSxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO3FCQUN4QjtpQkFDRjtxQkFBTSxJQUFJLE9BQU8sSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtvQkFDeEQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQzFDO2FBQ0Y7U0FDRjtRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNPLDBCQUEwQjtRQUNsQyxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxrRkFBa0Y7SUFDbEYsc0VBQXNFO0lBQzVELGdCQUFnQjtRQUN4QixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSx1QkFBdUIsQ0FBQyxHQUFRO1FBQ3JDLCtGQUErRjtRQUMvRixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixPQUFPO1NBQ1I7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDM0MsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDeEUsTUFBTSxTQUFTLEdBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFjLENBQUM7Z0JBRWxFLHdFQUF3RTtnQkFDeEUsbURBQW1EO2dCQUNuRCx3RkFBd0Y7Z0JBQ3hGLHVGQUF1RjtnQkFDdkYsT0FBTyxTQUFTLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7b0JBQ3RDLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDMUM7Z0JBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNwRCxJQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRSxFQUFFO3dCQUN0QyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBc0MsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNwRzt5QkFBTTt3QkFDTCxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDMUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7cUJBQzlCO2lCQUNGO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkI7UUFDakMsT0FBTyxPQUFTLElBQTRELENBQUMsc0JBQXNCLEtBQUssVUFBVSxDQUFDO0lBQ3JILENBQUM7SUFFRCx1R0FBdUc7SUFDdkcsbUdBQW1HO0lBQ25HLGdDQUFnQztJQUN6QixrQkFBa0I7UUFDdkIsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLHlDQUF5QztJQUMvQixvQkFBb0IsQ0FDNUIsR0FBNEIsRUFDNUIsYUFBNEM7UUFFNUMsT0FBUSxHQUE0QixDQUFDO0lBQ3ZDLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLHNCQUFzQixDQUFDLFNBQXdCO1FBQ3ZELE9BQVEsU0FBcUMsQ0FBQztJQUNoRCxDQUFDO0NBQ0YsQ0FBQTtBQXZRbUI7SUFBakIsS0FBSyxDQUFDLFNBQVMsQ0FBQzs7c0RBQWdFO0FBUDdELG1CQUFtQjtJQUZ4QyxTQUFTLEVBQUU7SUFDWixtREFBbUQ7R0FDN0IsbUJBQW1CLENBOFF4QztTQTlRcUIsbUJBQW1CO0FBa1J6QyxJQUFzQix3QkFBd0I7QUFEOUMsbURBQW1EO0FBQ25ELE1BQXNCLHdCQUEwRCxTQUFRLG1CQUd2RjtDQU1BLENBQUE7QUFUcUIsd0JBQXdCO0lBRjdDLFNBQVMsRUFBRTtJQUNaLG1EQUFtRDtHQUM3Qix3QkFBd0IsQ0FTN0M7U0FUcUIsd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJDb250ZW50Q2hlY2tlZCwgRGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7XHJcbiAgQWJzdHJhY3RDb250cm9sLFxyXG4gIEFic3RyYWN0Q29udHJvbE9wdGlvbnMsXHJcbiAgQXN5bmNWYWxpZGF0b3JGbixcclxuICBGb3JtQXJyYXksXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgVmFsaWRhdG9yRm4sXHJcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcblxyXG5pbXBvcnQgeyBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yLCBjb2VyY2VUb1ZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtY29udHJvbC11dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgQXJyYXlQcm9wZXJ0eUtleSxcclxuICBDb250cm9sTWFwLFxyXG4gIENvbnRyb2xzLFxyXG4gIENvbnRyb2xzTmFtZXMsXHJcbiAgQ29udHJvbHNUeXBlLFxyXG4gIGlzTnVsbE9yVW5kZWZpbmVkLFxyXG4gIFR5cGVkQWJzdHJhY3RDb250cm9sLFxyXG59IGZyb20gJy4vbmd4LXN1Yi1mb3JtLXV0aWxzJztcclxuaW1wb3J0IHsgRm9ybUdyb3VwT3B0aW9ucywgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzLCBUeXBlZFN1YkZvcm1Hcm91cCB9IGZyb20gJy4vbmd4LXN1Yi1mb3JtLnR5cGVzJztcclxuaW1wb3J0IHsgcGF0Y2hGb3JtQ29udHJvbCwgU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9zdWItZm9ybS1ncm91cCc7XHJcblxyXG50eXBlIE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4gPSAoY3RybDogQWJzdHJhY3RDb250cm9sLCBrZXk6IGtleW9mIEZvcm1JbnRlcmZhY2UpID0+IE1hcFZhbHVlO1xyXG50eXBlIEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPiA9IChcclxuICBjdHJsOiBUeXBlZEFic3RyYWN0Q29udHJvbDxhbnk+LFxyXG4gIGtleToga2V5b2YgRm9ybUludGVyZmFjZSxcclxuICBpc0N0cmxXaXRoaW5Gb3JtQXJyYXk6IGJvb2xlYW4sXHJcbikgPT4gYm9vbGVhbjtcclxuXHJcbkBEaXJlY3RpdmUoKVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5neFN1YkZvcm1Db21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZSA9IENvbnRyb2xJbnRlcmZhY2U+XHJcbiAgaW1wbGVtZW50cyBPbkNoYW5nZXMsIEFmdGVyQ29udGVudENoZWNrZWQge1xyXG4gIC8vIHdoZW4gZGV2ZWxvcGluZyB0aGUgbGliIGl0J3MgYSBnb29kIGlkZWEgdG8gc2V0IHRoZSBmb3JtR3JvdXAgdHlwZVxyXG4gIC8vIHRvIGN1cnJlbnQgKyBgfCB1bmRlZmluZWRgIHRvIGNhdGNoIGEgYnVuY2ggb2YgcG9zc2libGUgaXNzdWVzXHJcbiAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkXHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8taW5wdXQtcmVuYW1lXHJcbiAgQElucHV0KCdzdWJGb3JtJykgZm9ybUdyb3VwITogVHlwZWRTdWJGb3JtR3JvdXA8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT47XHJcblxyXG4gIHByb3RlY3RlZCBlbWl0TnVsbE9uRGVzdHJveSA9IHRydWU7XHJcbiAgcHJvdGVjdGVkIGVtaXRJbml0aWFsVmFsdWVPbkluaXQgPSB0cnVlO1xyXG4gIHByaXZhdGUgbmdPbkNoYW5nZXNXYXNDYWxsZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gY2FuJ3QgZGVmaW5lIHRoZW0gZGlyZWN0bHlcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0Rm9ybUNvbnRyb2xzKCk6IENvbnRyb2xzPEZvcm1JbnRlcmZhY2U+O1xyXG5cclxuICBwdWJsaWMgZ2V0IGZvcm1Db250cm9sTmFtZXMoKTogQ29udHJvbHNOYW1lczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWQgZm9yIGFzIHN5bnRheFxyXG4gICAgcmV0dXJuIHRoaXMubWFwQ29udHJvbHMoXHJcbiAgICAgIChfLCBrZXkpID0+IGtleSxcclxuICAgICAgKCkgPT4gdHJ1ZSxcclxuICAgICAgZmFsc2UsXHJcbiAgICApIGFzIENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT47XHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICB0aGlzLm5nT25DaGFuZ2VzV2FzQ2FsbGVkID0gdHJ1ZTtcclxuICAgIGlmIChjaGFuZ2VzWydkYXRhSW5wdXQnXSA9PT0gdW5kZWZpbmVkICYmIGNoYW5nZXNbJ2Zvcm1Hcm91cCddID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMuZm9ybUdyb3VwIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IG5lZWRzIHRvIGJlIG9mIHR5cGUgU3ViRm9ybUdyb3VwLicpO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnJlbW92ZUNvbnRyb2woa2V5KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHN1YkZvcm0gPSB0aGlzLmZvcm1Hcm91cDtcclxuXHJcbiAgICBjb25zdCBjb250cm9scyA9IHRoaXMuZ2V0Rm9ybUNvbnRyb2xzKCk7XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb250cm9scykge1xyXG4gICAgICBpZiAoY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBjb250cm9sc1trZXldO1xyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHdpcmUgdXAgdGhlIGZvcm0gY29udHJvbHMgd2l0aCB0aGUgc3ViIGZvcm0gZ3JvdXBcclxuICAgICAgICAvLyB0aGlzIGFsbG93cyB1cyB0byB0cmFuc2Zvcm0gdGhlIHN1YiBmb3JtIHZhbHVlIHRvIENvbnRyb2xJbnRlcmZhY2VcclxuICAgICAgICAvLyBldmVyeSB0aW1lIGFueSBvZiB0aGUgZm9ybSBjb250cm9scyBvbiB0aGUgc3ViIGZvcm0gY2hhbmdlXHJcbiAgICAgICAgaWYgKGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQ29udHJvbCkge1xyXG4gICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbChzdWJGb3JtLCBjb250cm9sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmFkZENvbnRyb2woa2V5LCBjb250cm9sKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbm5lY3Qgc3ViIGZvcm0gZ3JvdXAgd2l0aCBjdXJyZW50IHN1Yi1mb3JtLWNvbXBvbmVudFxyXG4gICAgc3ViRm9ybS5zZXRTdWJGb3JtKHRoaXMpO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLmdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zKCkgYXMgQWJzdHJhY3RDb250cm9sT3B0aW9ucztcclxuXHJcbiAgICBjb25zdCB2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbltdID0gW107XHJcbiAgICBjb25zdCBhc3luY1ZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG5cclxuICAgIC8vIGdldCB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50VmFsaWRhdG9yT3JPcHRzKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGFzeW5jIHZhbGlkYXRvcnMgdGhhdCB3ZXJlIHBhc3NlZCBpbnRvIHRoZSBzdWIgZm9ybSBncm91cCBvbiB0aGUgcGFyZW50XHJcbiAgICBpZiAoc3ViRm9ybS5wYXJlbnRBc3luY1ZhbGlkYXRvcikge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpO1xyXG4gICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBBYnN0cmFjdENvbnRyb2xPcHRpb25zIGZyb20gZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uKSB7XHJcbiAgICAgICAgLy8gc2FkbHkgdGhlcmUgaXMgbm8gcHVibGljIG1ldG9oZCB0aGF0IGxldHMgdXMgY2hhbmdlIHRoZSB1cGRhdGUgc3RyYXRlZ3kgb2YgYW4gYWxyZWFkeSBjcmVhdGVkIEZvcm1Hcm91cFxyXG4gICAgICAgICh0aGlzLmZvcm1Hcm91cCBhcyBhbnkpLl9zZXRVcGRhdGVTdHJhdGVneShvcHRpb25zLnVwZGF0ZU9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdG9ycykge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IGNvZXJjZVRvVmFsaWRhdG9yKG9wdGlvbnMudmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5hc3luY1ZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb0FzeW5jVmFsaWRhdG9yKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgICBhc3luY1ZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB2YWxpZGF0b3JzIC8gYXN5bmMgdmFsaWRhdG9ycyBvbiBzdWIgZm9ybSBncm91cFxyXG4gICAgaWYgKHZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRWYWxpZGF0b3JzKHZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFzeW5jVmFsaWRhdG9ycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuZm9ybUdyb3VwLnNldEFzeW5jVmFsaWRhdG9ycyhhc3luY1ZhbGlkYXRvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZSBmb3JtIGhhcyBkZWZhdWx0IHZhbHVlcywgdGhleSBzaG91bGQgYmUgYXBwbGllZCBzdHJhaWdodCBhd2F5XHJcbiAgICBjb25zdCBkZWZhdWx0VmFsdWVzOiBQYXJ0aWFsPEZvcm1JbnRlcmZhY2U+IHwgbnVsbCA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlcygpO1xyXG5cclxuICAgIC8vIGdldCBkZWZhdWx0IHZhbHVlcyBmb3IgcmVzZXQsIGlmIG51bGwgZmFsbGJhY2sgdG8gdW5kZWZpbmVkIGFzIHRoZXJlIHNpIGEgZGlmZmVyZW5jZSB3aGVuIGNhbGxpbmcgcmVzZXRcclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkVmFsdWUgPSB0aGlzLnRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZGVmYXVsdFZhbHVlcyBhcyBGb3JtSW50ZXJmYWNlKSB8fCB1bmRlZmluZWQ7XHJcbiAgICAvLyBzaW5jZSB0aGlzIGlzIHRoZSBpbml0aWFsIHNldHRpbmcgb2YgZm9ybSB2YWx1ZXMgZG8gTk9UIGVtaXQgYW4gZXZlbnRcclxuXHJcbiAgICBsZXQgbWVyZ2VkVmFsdWVzOiBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodHJhbnNmb3JtZWRWYWx1ZSkpIHtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0gc3ViRm9ybS5jb250cm9sVmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBjb250cm9sVmFsdWUgPSAoY2hhbmdlc1snZGF0YUlucHV0J10gPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSB8fCB7fTtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0geyAuLi50cmFuc2Zvcm1lZFZhbHVlLCAuLi5jb250cm9sVmFsdWUgfSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpOiB2b2lkIHtcclxuICAgIC8vIFRPRE8gdGhpcyBydW5zIHRvbyBvZnRlbiwgZmluZCBvdXQgb2YgdGhpcyBjYW4gYmUgdHJpZ2dlcmVkIGRpZmZlcmVudGx5XHJcbiAgICAvLyBjaGVja2luZyBpZiB0aGUgZm9ybSBncm91cCBoYXMgYSBjaGFuZ2UgZGV0ZWN0b3IgKHJvb3QgZm9ybXMgbWlnaHQgbm90KVxyXG4gICAgaWYgKHRoaXMubmdPbkNoYW5nZXNXYXNDYWxsZWQgJiYgdGhpcy5mb3JtR3JvdXAuY2QpIHtcclxuICAgICAgLy8gaWYgdGhpcyBpcyB0aGUgcm9vdCBmb3JtXHJcbiAgICAgIC8vIE9SIGlmIGlzdCBhIHN1YiBmb3JtIGJ1dCB0aGUgcm9vdCBmb3JtIGRvZXMgbm90IGhhdmUgYSBjaGFuZ2UgZGV0ZWN0b3JcclxuICAgICAgLy8gd2UgbmVlZCB0byBhY3R1YWxseSBydW4gY2hhbmdlIGRldGVjdGlvbiB2cyBqdXN0IG1hcmtpbmcgZm9yIGNoZWNrXHJcbiAgICAgIGlmICghdGhpcy5mb3JtR3JvdXAucGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5mb3JtR3JvdXAuY2QuZGV0ZWN0Q2hhbmdlcygpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4sXHJcbiAgICByZWN1cnNpdmVJZkFycmF5OiBib29sZWFuLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICk6IENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPiB8IG51bGw7XHJcbiAgcHJpdmF0ZSBtYXBDb250cm9sczxNYXBWYWx1ZT4oXHJcbiAgICBtYXBDb250cm9sOiBNYXBDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZSwgTWFwVmFsdWU+LFxyXG4gICAgZmlsdGVyQ29udHJvbDogRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKCkgPT4gdHJ1ZSxcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4gPSB0cnVlLFxyXG4gICk6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiB8IG51bGwge1xyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtQ29udHJvbHM6IENvbnRyb2xzVHlwZTxGb3JtSW50ZXJmYWNlPiA9IHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzO1xyXG5cclxuICAgIGNvbnN0IGNvbnRyb2xzOiBQYXJ0aWFsPENvbnRyb2xNYXA8Rm9ybUludGVyZmFjZSwgTWFwVmFsdWUgfCBNYXBWYWx1ZVtdPj4gPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBmb3JtQ29udHJvbHMpIHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gZm9ybUNvbnRyb2xzW2tleV07XHJcblxyXG4gICAgICAgIGlmIChyZWN1cnNpdmVJZkFycmF5ICYmIGNvbnRyb2wgaW5zdGFuY2VvZiBGb3JtQXJyYXkpIHtcclxuICAgICAgICAgIGNvbnN0IHZhbHVlczogTWFwVmFsdWVbXSA9IFtdO1xyXG5cclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udHJvbC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXksIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWVzLnB1c2gobWFwQ29udHJvbChjb250cm9sLmF0KGkpLCBrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCAmJiB2YWx1ZXMuc29tZSh4ID0+ICFpc051bGxPclVuZGVmaW5lZCh4KSkpIHtcclxuICAgICAgICAgICAgY29udHJvbHNba2V5XSA9IHZhbHVlcztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRyb2wgJiYgZmlsdGVyQ29udHJvbChjb250cm9sLCBrZXksIGZhbHNlKSkge1xyXG4gICAgICAgICAgY29udHJvbHNba2V5XSA9IG1hcENvbnRyb2woY29udHJvbCwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29udHJvbHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRlbmQgdGhpcyBtZXRob2QgdG8gcHJvdmlkZSBjdXN0b20gbG9jYWwgRm9ybUdyb3VwIGxldmVsIHZhbGlkYXRpb25cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0Rm9ybUdyb3VwQ29udHJvbE9wdGlvbnMoKTogRm9ybUdyb3VwT3B0aW9uczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGdldERlZmF1bHRWYWx1ZXMgaXMgZGVmaW5lZCwgeW91IGRvIG5vdCBuZWVkIHRvIHNwZWNpZnkgdGhlIGRlZmF1bHQgdmFsdWVzXHJcbiAgLy8gaW4geW91ciBmb3JtICh0aGUgb25lcyBkZWZpbmVkIHdpdGhpbiB0aGUgYGdldEZvcm1Db250cm9sc2AgbWV0aG9kKVxyXG4gIHByb3RlY3RlZCBnZXREZWZhdWx0VmFsdWVzKCk6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKG9iajogYW55KSB7XHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHRoaXMgY2FuIHN0aWxsIGhhcHBlbiwgaXQgYXBwcmVhZGVkIGR1cmluZyBkZXZlbG9wbWVudC4gbWlnaHQgYWxlcmFkeSBiZSBmaXhlZFxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmVudHJpZXMob2JqKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuICAgICAgaWYgKHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGluc3RhbmNlb2YgRm9ybUFycmF5ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3QgZm9ybUFycmF5OiBGb3JtQXJyYXkgPSB0aGlzLmZvcm1Hcm91cC5nZXQoa2V5KSBhcyBGb3JtQXJyYXk7XHJcblxyXG4gICAgICAgIC8vIGluc3RlYWQgb2YgY3JlYXRpbmcgYSBuZXcgYXJyYXkgZXZlcnkgdGltZSBhbmQgcHVzaCBhIG5ldyBGb3JtQ29udHJvbFxyXG4gICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlIG9yIGFkZCB3aGF0IGlzIG5lY2Vzc2FyeSBzbyB0aGF0OlxyXG4gICAgICAgIC8vIC0gaXQgaXMgYXMgZWZmaWNpZW50IGFzIHBvc3NpYmxlIGFuZCBkbyBub3QgY3JlYXRlIHVubmVjZXNzYXJ5IEZvcm1Db250cm9sIGV2ZXJ5IHRpbWVcclxuICAgICAgICAvLyAtIHZhbGlkYXRvcnMgYXJlIG5vdCBkZXN0cm95ZWQvY3JlYXRlZCBhZ2FpbiBhbmQgZXZlbnR1YWxseSBmaXJlIGFnYWluIGZvciBubyByZWFzb25cclxuICAgICAgICB3aGlsZSAoZm9ybUFycmF5Lmxlbmd0aCA+IHZhbHVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGZvcm1BcnJheS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBmb3JtQXJyYXkubGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmICh0aGlzLmZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpKSB7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgdGhpcy5jcmVhdGVGb3JtQXJyYXlDb250cm9sKGtleSBhcyBBcnJheVByb3BlcnR5S2V5PEZvcm1JbnRlcmZhY2U+LCB2YWx1ZVtpXSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgY29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCh2YWx1ZVtpXSk7XHJcbiAgICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2wodGhpcy5mb3JtR3JvdXAsIGNvbnRyb2wpO1xyXG4gICAgICAgICAgICBmb3JtQXJyYXkuaW5zZXJ0KGksIGNvbnRyb2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZvcm1Jc0Zvcm1XaXRoQXJyYXlDb250cm9scygpOiB0aGlzIGlzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4gdHlwZW9mICgodGhpcyBhcyB1bmtub3duKSBhcyBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHM8Rm9ybUludGVyZmFjZT4pLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2wgPT09ICdmdW5jdGlvbic7XHJcbiAgfVxyXG5cclxuICAvLyB3aGVuIGN1c3RvbWl6aW5nIHRoZSBlbWlzc2lvbiByYXRlIG9mIHlvdXIgc3ViIGZvcm0gY29tcG9uZW50LCByZW1lbWJlciBub3QgdG8gKiptdXRhdGUqKiB0aGUgc3RyZWFtXHJcbiAgLy8gaXQgaXMgc2FmZSB0byB0aHJvdHRsZSwgZGVib3VuY2UsIGRlbGF5LCBldGMgYnV0IHVzaW5nIHNraXAsIGZpcnN0LCBsYXN0IG9yIG11dGF0aW5nIGRhdGEgaW5zaWRlXHJcbiAgLy8gdGhlIHN0cmVhbSB3aWxsIGNhdXNlIGlzc3VlcyFcclxuICBwdWJsaWMgaGFuZGxlRW1pc3Npb25SYXRlKCk6IChvYnMkOiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPikgPT4gT2JzZXJ2YWJsZTxDb250cm9sSW50ZXJmYWNlIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG9icyQgPT4gb2JzJDtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsIHtcclxuICAgIHJldHVybiAob2JqIGFzIGFueSkgYXMgRm9ybUludGVyZmFjZTtcclxuICB9XHJcblxyXG4gIC8vIHRoYXQgbWV0aG9kIGNhbiBiZSBvdmVycmlkZGVuIGlmIHRoZVxyXG4gIC8vIHNoYXBlIG9mIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG1vZGlmaWVkXHJcbiAgcHJvdGVjdGVkIHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChmb3JtVmFsdWUgYXMgYW55KSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gIH1cclxufVxyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybVJlbWFwQ29tcG9uZW50PENvbnRyb2xJbnRlcmZhY2UsIEZvcm1JbnRlcmZhY2U+IGV4dGVuZHMgTmd4U3ViRm9ybUNvbXBvbmVudDxcclxuICBDb250cm9sSW50ZXJmYWNlLFxyXG4gIEZvcm1JbnRlcmZhY2VcclxuPiB7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybVRvRm9ybUdyb3VwKFxyXG4gICAgb2JqOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCxcclxuICAgIGRlZmF1bHRWYWx1ZXM6IFBhcnRpYWw8Rm9ybUludGVyZmFjZT4gfCBudWxsLFxyXG4gICk6IEZvcm1JbnRlcmZhY2UgfCBudWxsO1xyXG4gIHByb3RlY3RlZCBhYnN0cmFjdCB0cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGZvcm1WYWx1ZTogRm9ybUludGVyZmFjZSk6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsO1xyXG59XHJcbiJdfQ==