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
    }
    get formControlNames() {
        // see @note form-group-undefined for as syntax
        return this.mapControls((_, key) => key, () => true, false);
    }
    ngOnChanges(changes) {
        if (changes['dataInput'] === undefined &&
            (changes['formGroup'] === undefined || (changes['formGroup'].firstChange && !changes['formGroup'].currentValue))) {
            return;
        }
        if (!this.formGroup) {
            throw new Error('The subForm input was not provided but is required.');
        }
        if (!(this.formGroup instanceof SubFormGroup)) {
            throw new Error('The subForm input needs to be of type SubFormGroup.');
        }
        const dataInputHasChanged = changes['dataInput'] !== undefined;
        this._initializeFormGroup(dataInputHasChanged);
    }
    ngAfterContentChecked() {
        var _a;
        // TODO this runs too often, find out of this can be triggered differently
        // checking if the form group has a change detector (root forms might not)
        if ((_a = this.formGroup) === null || _a === void 0 ? void 0 : _a.cd) {
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
    // is usually called by ngOnChanges
    // but if root form is used without input attributes ngOnChanges might not be called
    // hence if it wasn't called yet it is called from ngOnInit in root form
    _initializeFormGroup(dataInputHasChanged = false) {
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
            const controlValue = (dataInputHasChanged ? this['dataInput'] : subForm.controlValue) || {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXN1Yi1mb3JtLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiJuZzovL25neC1zdWItZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9uZ3gtc3ViLWZvcm0uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQXVCLFNBQVMsRUFBRSxLQUFLLEVBQTRCLE1BQU0sZUFBZSxDQUFDO0FBQ2hHLE9BQU8sRUFJTCxTQUFTLEVBQ1QsV0FBVyxHQUVaLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEIsT0FBTyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckYsT0FBTyxFQU1MLGlCQUFpQixHQUVsQixNQUFNLHNCQUFzQixDQUFDO0FBRTlCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVdsRSxJQUFzQixtQkFBbUI7QUFEekMsbURBQW1EO0FBQ25ELE1BQXNCLG1CQUFtQjtJQUF6QztRQUVFLHFFQUFxRTtRQUNyRSxpRUFBaUU7UUFDakUsaUNBQWlDO1FBS3ZCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFpUjFDLENBQUM7SUE1UUMsSUFBVyxnQkFBZ0I7UUFDekIsK0NBQStDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQ2YsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEtBQUssQ0FDMEIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQ0UsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVM7WUFDbEMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUNoSDtZQUNBLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztTQUN4RTtRQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLFlBQVksWUFBWSxDQUFDLEVBQUU7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1NBQ3hFO1FBRUQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFBO1FBQzlELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxxQkFBcUI7O1FBQ25CLDBFQUEwRTtRQUMxRSwwRUFBMEU7UUFDMUUsVUFBSSxJQUFJLENBQUMsU0FBUywwQ0FBRSxFQUFFLEVBQUU7WUFDdEIsMkJBQTJCO1lBQzNCLHlFQUF5RTtZQUN6RSxxRUFBcUU7WUFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUNuQztpQkFBTTtnQkFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQzthQUNsQztTQUNGO0lBQ0gsQ0FBQztJQUVELG1DQUFtQztJQUNuQyxvRkFBb0Y7SUFDcEYsd0VBQXdFO0lBQzlELG9CQUFvQixDQUFDLHNCQUErQixLQUFLO1FBQ2pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBRS9CLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN4QyxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRTtZQUMxQixJQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2hDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFOUIsK0RBQStEO2dCQUMvRCxxRUFBcUU7Z0JBQ3JFLDZEQUE2RDtnQkFDN0QsSUFBSSxPQUFPLFlBQVksV0FBVyxFQUFFO29CQUNsQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3BDO2dCQUVELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUN6QztTQUNGO1FBRUQseURBQXlEO1FBQ3pELE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixFQUE0QixDQUFDO1FBRTVFLE1BQU0sVUFBVSxHQUFrQixFQUFFLENBQUM7UUFDckMsTUFBTSxlQUFlLEdBQXVCLEVBQUUsQ0FBQztRQUUvQyx3RUFBd0U7UUFDeEUsSUFBSSxPQUFPLENBQUMscUJBQXFCLEVBQUU7WUFDakMsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDbkUsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUM1QjtTQUNGO1FBRUQsOEVBQThFO1FBQzlFLElBQUksT0FBTyxDQUFDLG9CQUFvQixFQUFFO1lBQ2hDLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksU0FBUyxFQUFFO2dCQUNiLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDakM7U0FDRjtRQUVELGdFQUFnRTtRQUNoRSxJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDcEIsMEdBQTBHO2dCQUN6RyxJQUFJLENBQUMsU0FBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDOUQ7WUFFRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RCLE1BQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxTQUFTLEVBQUU7b0JBQ2IsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDNUI7YUFDRjtZQUVELElBQUksT0FBTyxDQUFDLGVBQWUsRUFBRTtnQkFDM0IsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLFNBQVMsRUFBRTtvQkFDYixlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUNqQzthQUNGO1NBQ0Y7UUFFRCxzREFBc0Q7UUFDdEQsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMxQztRQUNELElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUNwRDtRQUVELHVFQUF1RTtRQUN2RSxNQUFNLGFBQWEsR0FBa0MsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFN0UsMEdBQTBHO1FBQzFHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQThCLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDbEcsd0VBQXdFO1FBRXhFLElBQUksWUFBOEIsQ0FBQztRQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtZQUNuQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztTQUNyQzthQUFNO1lBQ0wsTUFBTSxZQUFZLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUUsSUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JHLFlBQVksR0FBRyxnQ0FBSyxnQkFBZ0IsR0FBSyxZQUFZLENBQXNCLENBQUM7U0FDN0U7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4QyxnQ0FBZ0M7UUFDaEMsK0dBQStHO1FBQy9HLGdGQUFnRjtRQUNoRixzR0FBc0c7UUFDdEcsd0ZBQXdGO1FBRXhGLHdHQUF3RztRQUN4Ryx3R0FBd0c7UUFDeEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBVU8sV0FBVyxDQUNqQixVQUF1RCxFQUN2RCxnQkFBc0QsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNoRSxtQkFBNEIsSUFBSTtRQUVoQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxZQUFZLEdBQWdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBRTFFLE1BQU0sUUFBUSxHQUE4RCxFQUFFLENBQUM7UUFFL0UsS0FBSyxNQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUU7WUFDOUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQy9DLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFbEMsSUFBSSxnQkFBZ0IsSUFBSSxPQUFPLFlBQVksU0FBUyxFQUFFO29CQUNwRCxNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7b0JBRTlCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO3dCQUN2QyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRTs0QkFDM0MsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUM3QztxQkFDRjtvQkFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ2hFLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUM7cUJBQ3hCO2lCQUNGO3FCQUFNLElBQUksT0FBTyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUN4RCxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDMUM7YUFDRjtTQUNGO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVEOztPQUVHO0lBQ08sMEJBQTBCO1FBQ2xDLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELGtGQUFrRjtJQUNsRixzRUFBc0U7SUFDNUQsZ0JBQWdCO1FBQ3hCLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVNLHVCQUF1QixDQUFDLEdBQVE7UUFDckMsK0ZBQStGO1FBQy9GLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE9BQU87U0FDUjtRQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUN4RSxNQUFNLFNBQVMsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQWMsQ0FBQztnQkFFbEUsd0VBQXdFO2dCQUN4RSxtREFBbUQ7Z0JBQ25ELHdGQUF3RjtnQkFDeEYsdUZBQXVGO2dCQUN2RixPQUFPLFNBQVMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtvQkFDdEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUMxQztnQkFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3BELElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFLEVBQUU7d0JBQ3RDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFzQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3BHO3lCQUFNO3dCQUNMLE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMxQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO3dCQUMxQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztxQkFDOUI7aUJBQ0Y7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLDJCQUEyQjtRQUNqQyxPQUFPLE9BQVMsSUFBNEQsQ0FBQyxzQkFBc0IsS0FBSyxVQUFVLENBQUM7SUFDckgsQ0FBQztJQUVELHVHQUF1RztJQUN2RyxtR0FBbUc7SUFDbkcsZ0NBQWdDO0lBQ3pCLGtCQUFrQjtRQUN2QixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO0lBQ3RCLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMseUNBQXlDO0lBQy9CLG9CQUFvQixDQUM1QixHQUE0QixFQUM1QixhQUE0QztRQUU1QyxPQUFRLEdBQTRCLENBQUM7SUFDdkMsQ0FBQztJQUVELHVDQUF1QztJQUN2Qyx5Q0FBeUM7SUFDL0Isc0JBQXNCLENBQUMsU0FBd0I7UUFDdkQsT0FBUSxTQUFxQyxDQUFDO0lBQ2hELENBQUM7Q0FDRixDQUFBO0FBcFJtQjtJQUFqQixLQUFLLENBQUMsU0FBUyxDQUFDOztzREFBZ0U7QUFQN0QsbUJBQW1CO0lBRnhDLFNBQVMsRUFBRTtJQUNaLG1EQUFtRDtHQUM3QixtQkFBbUIsQ0EyUnhDO1NBM1JxQixtQkFBbUI7QUErUnpDLElBQXNCLHdCQUF3QjtBQUQ5QyxtREFBbUQ7QUFDbkQsTUFBc0Isd0JBQTBELFNBQVEsbUJBR3ZGO0NBTUEsQ0FBQTtBQVRxQix3QkFBd0I7SUFGN0MsU0FBUyxFQUFFO0lBQ1osbURBQW1EO0dBQzdCLHdCQUF3QixDQVM3QztTQVRxQix3QkFBd0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlckNvbnRlbnRDaGVja2VkLCBEaXJlY3RpdmUsIElucHV0LCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdENvbnRyb2wsXHJcbiAgQWJzdHJhY3RDb250cm9sT3B0aW9ucyxcclxuICBBc3luY1ZhbGlkYXRvckZuLFxyXG4gIEZvcm1BcnJheSxcclxuICBGb3JtQ29udHJvbCxcclxuICBWYWxpZGF0b3JGbixcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuXHJcbmltcG9ydCB7IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3IsIGNvZXJjZVRvVmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdC1jb250cm9sLXV0aWxzJztcclxuaW1wb3J0IHtcclxuICBBcnJheVByb3BlcnR5S2V5LFxyXG4gIENvbnRyb2xNYXAsXHJcbiAgQ29udHJvbHMsXHJcbiAgQ29udHJvbHNOYW1lcyxcclxuICBDb250cm9sc1R5cGUsXHJcbiAgaXNOdWxsT3JVbmRlZmluZWQsXHJcbiAgVHlwZWRBYnN0cmFjdENvbnRyb2wsXHJcbn0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0tdXRpbHMnO1xyXG5pbXBvcnQgeyBGb3JtR3JvdXBPcHRpb25zLCBOZ3hGb3JtV2l0aEFycmF5Q29udHJvbHMsIFR5cGVkU3ViRm9ybUdyb3VwIH0gZnJvbSAnLi9uZ3gtc3ViLWZvcm0udHlwZXMnO1xyXG5pbXBvcnQgeyBwYXRjaEZvcm1Db250cm9sLCBTdWJGb3JtR3JvdXAgfSBmcm9tICcuL3N1Yi1mb3JtLWdyb3VwJztcclxuXHJcbnR5cGUgTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPiA9IChjdHJsOiBBYnN0cmFjdENvbnRyb2wsIGtleToga2V5b2YgRm9ybUludGVyZmFjZSkgPT4gTWFwVmFsdWU7XHJcbnR5cGUgRmlsdGVyQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2U+ID0gKFxyXG4gIGN0cmw6IFR5cGVkQWJzdHJhY3RDb250cm9sPGFueT4sXHJcbiAga2V5OiBrZXlvZiBGb3JtSW50ZXJmYWNlLFxyXG4gIGlzQ3RybFdpdGhpbkZvcm1BcnJheTogYm9vbGVhbixcclxuKSA9PiBib29sZWFuO1xyXG5cclxuQERpcmVjdGl2ZSgpXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLWNsYXNzLXN1ZmZpeFxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4U3ViRm9ybUNvbXBvbmVudDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlID0gQ29udHJvbEludGVyZmFjZT5cclxuICBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50Q2hlY2tlZCB7XHJcbiAgLy8gd2hlbiBkZXZlbG9waW5nIHRoZSBsaWIgaXQncyBhIGdvb2QgaWRlYSB0byBzZXQgdGhlIGZvcm1Hcm91cCB0eXBlXHJcbiAgLy8gdG8gY3VycmVudCArIGB8IHVuZGVmaW5lZGAgdG8gY2F0Y2ggYSBidW5jaCBvZiBwb3NzaWJsZSBpc3N1ZXNcclxuICAvLyBzZWUgQG5vdGUgZm9ybS1ncm91cC11bmRlZmluZWRcclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1pbnB1dC1yZW5hbWVcclxuICBASW5wdXQoJ3N1YkZvcm0nKSBmb3JtR3JvdXAhOiBUeXBlZFN1YkZvcm1Hcm91cDxDb250cm9sSW50ZXJmYWNlLCBGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHJvdGVjdGVkIGVtaXROdWxsT25EZXN0cm95ID0gdHJ1ZTtcclxuICBwcm90ZWN0ZWQgZW1pdEluaXRpYWxWYWx1ZU9uSW5pdCA9IHRydWU7XHJcblxyXG4gIC8vIGNhbid0IGRlZmluZSB0aGVtIGRpcmVjdGx5XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEZvcm1Db250cm9scygpOiBDb250cm9sczxGb3JtSW50ZXJmYWNlPjtcclxuXHJcbiAgcHVibGljIGdldCBmb3JtQ29udHJvbE5hbWVzKCk6IENvbnRyb2xzTmFtZXM8Rm9ybUludGVyZmFjZT4ge1xyXG4gICAgLy8gc2VlIEBub3RlIGZvcm0tZ3JvdXAtdW5kZWZpbmVkIGZvciBhcyBzeW50YXhcclxuICAgIHJldHVybiB0aGlzLm1hcENvbnRyb2xzKFxyXG4gICAgICAoXywga2V5KSA9PiBrZXksXHJcbiAgICAgICgpID0+IHRydWUsXHJcbiAgICAgIGZhbHNlLFxyXG4gICAgKSBhcyBDb250cm9sc05hbWVzPEZvcm1JbnRlcmZhY2U+O1xyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xyXG4gICAgaWYgKFxyXG4gICAgICBjaGFuZ2VzWydkYXRhSW5wdXQnXSA9PT0gdW5kZWZpbmVkICYmXHJcbiAgICAgIChjaGFuZ2VzWydmb3JtR3JvdXAnXSA9PT0gdW5kZWZpbmVkIHx8IChjaGFuZ2VzWydmb3JtR3JvdXAnXS5maXJzdENoYW5nZSAmJiAhY2hhbmdlc1snZm9ybUdyb3VwJ10uY3VycmVudFZhbHVlKSlcclxuICAgICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmZvcm1Hcm91cCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IHdhcyBub3QgcHJvdmlkZWQgYnV0IGlzIHJlcXVpcmVkLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMuZm9ybUdyb3VwIGluc3RhbmNlb2YgU3ViRm9ybUdyb3VwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzdWJGb3JtIGlucHV0IG5lZWRzIHRvIGJlIG9mIHR5cGUgU3ViRm9ybUdyb3VwLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRhdGFJbnB1dEhhc0NoYW5nZWQgPSBjaGFuZ2VzWydkYXRhSW5wdXQnXSAhPT0gdW5kZWZpbmVkXHJcbiAgICB0aGlzLl9pbml0aWFsaXplRm9ybUdyb3VwKGRhdGFJbnB1dEhhc0NoYW5nZWQpO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyB0aGlzIHJ1bnMgdG9vIG9mdGVuLCBmaW5kIG91dCBvZiB0aGlzIGNhbiBiZSB0cmlnZ2VyZWQgZGlmZmVyZW50bHlcclxuICAgIC8vIGNoZWNraW5nIGlmIHRoZSBmb3JtIGdyb3VwIGhhcyBhIGNoYW5nZSBkZXRlY3RvciAocm9vdCBmb3JtcyBtaWdodCBub3QpXHJcbiAgICBpZiAodGhpcy5mb3JtR3JvdXA/LmNkKSB7XHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgdGhlIHJvb3QgZm9ybVxyXG4gICAgICAvLyBPUiBpZiBpc3QgYSBzdWIgZm9ybSBidXQgdGhlIHJvb3QgZm9ybSBkb2VzIG5vdCBoYXZlIGEgY2hhbmdlIGRldGVjdG9yXHJcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuIGNoYW5nZSBkZXRlY3Rpb24gdnMganVzdCBtYXJraW5nIGZvciBjaGVja1xyXG4gICAgICBpZiAoIXRoaXMuZm9ybUdyb3VwLnBhcmVudCkge1xyXG4gICAgICAgIHRoaXMuZm9ybUdyb3VwLmNkLmRldGVjdENoYW5nZXMoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gaXMgdXN1YWxseSBjYWxsZWQgYnkgbmdPbkNoYW5nZXNcclxuICAvLyBidXQgaWYgcm9vdCBmb3JtIGlzIHVzZWQgd2l0aG91dCBpbnB1dCBhdHRyaWJ1dGVzIG5nT25DaGFuZ2VzIG1pZ2h0IG5vdCBiZSBjYWxsZWRcclxuICAvLyBoZW5jZSBpZiBpdCB3YXNuJ3QgY2FsbGVkIHlldCBpdCBpcyBjYWxsZWQgZnJvbSBuZ09uSW5pdCBpbiByb290IGZvcm1cclxuICBwcm90ZWN0ZWQgX2luaXRpYWxpemVGb3JtR3JvdXAoZGF0YUlucHV0SGFzQ2hhbmdlZDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLmZvcm1Hcm91cC5jb250cm9scykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5yZW1vdmVDb250cm9sKGtleSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzdWJGb3JtID0gdGhpcy5mb3JtR3JvdXA7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHMgPSB0aGlzLmdldEZvcm1Db250cm9scygpO1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29udHJvbHMpIHtcclxuICAgICAgaWYgKGNvbnRyb2xzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICBjb25zdCBjb250cm9sID0gY29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byB3aXJlIHVwIHRoZSBmb3JtIGNvbnRyb2xzIHdpdGggdGhlIHN1YiBmb3JtIGdyb3VwXHJcbiAgICAgICAgLy8gdGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNmb3JtIHRoZSBzdWIgZm9ybSB2YWx1ZSB0byBDb250cm9sSW50ZXJmYWNlXHJcbiAgICAgICAgLy8gZXZlcnkgdGltZSBhbnkgb2YgdGhlIGZvcm0gY29udHJvbHMgb24gdGhlIHN1YiBmb3JtIGNoYW5nZVxyXG4gICAgICAgIGlmIChjb250cm9sIGluc3RhbmNlb2YgRm9ybUNvbnRyb2wpIHtcclxuICAgICAgICAgIHBhdGNoRm9ybUNvbnRyb2woc3ViRm9ybSwgY29udHJvbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZvcm1Hcm91cC5hZGRDb250cm9sKGtleSwgY29udHJvbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25uZWN0IHN1YiBmb3JtIGdyb3VwIHdpdGggY3VycmVudCBzdWItZm9ybS1jb21wb25lbnRcclxuICAgIHN1YkZvcm0uc2V0U3ViRm9ybSh0aGlzKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5nZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpIGFzIEFic3RyYWN0Q29udHJvbE9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgdmFsaWRhdG9yczogVmFsaWRhdG9yRm5bXSA9IFtdO1xyXG4gICAgY29uc3QgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZuW10gPSBbXTtcclxuXHJcbiAgICAvLyBnZXQgdmFsaWRhdG9ycyB0aGF0IHdlcmUgcGFzc2VkIGludG8gdGhlIHN1YiBmb3JtIGdyb3VwIG9uIHRoZSBwYXJlbnRcclxuICAgIGlmIChzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cykge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudFZhbGlkYXRvck9yT3B0cyk7XHJcbiAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBhc3luYyB2YWxpZGF0b3JzIHRoYXQgd2VyZSBwYXNzZWQgaW50byB0aGUgc3ViIGZvcm0gZ3JvdXAgb24gdGhlIHBhcmVudFxyXG4gICAgaWYgKHN1YkZvcm0ucGFyZW50QXN5bmNWYWxpZGF0b3IpIHtcclxuICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihzdWJGb3JtLnBhcmVudEFzeW5jVmFsaWRhdG9yKTtcclxuICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgIGFzeW5jVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGUgQWJzdHJhY3RDb250cm9sT3B0aW9ucyBmcm9tIGdldEZvcm1Hcm91cENvbnRyb2xPcHRpb25zXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbikge1xyXG4gICAgICAgIC8vIHNhZGx5IHRoZXJlIGlzIG5vIHB1YmxpYyBtZXRvaGQgdGhhdCBsZXRzIHVzIGNoYW5nZSB0aGUgdXBkYXRlIHN0cmF0ZWd5IG9mIGFuIGFscmVhZHkgY3JlYXRlZCBGb3JtR3JvdXBcclxuICAgICAgICAodGhpcy5mb3JtR3JvdXAgYXMgYW55KS5fc2V0VXBkYXRlU3RyYXRlZ3kob3B0aW9ucy51cGRhdGVPbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRvcnMpIHtcclxuICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBjb2VyY2VUb1ZhbGlkYXRvcihvcHRpb25zLnZhbGlkYXRvcnMpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYXN5bmNWYWxpZGF0b3JzKSB7XHJcbiAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gY29lcmNlVG9Bc3luY1ZhbGlkYXRvcihvcHRpb25zLmFzeW5jVmFsaWRhdG9ycyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xyXG4gICAgICAgICAgYXN5bmNWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdmFsaWRhdG9ycyAvIGFzeW5jIHZhbGlkYXRvcnMgb24gc3ViIGZvcm0gZ3JvdXBcclxuICAgIGlmICh2YWxpZGF0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5mb3JtR3JvdXAuc2V0VmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcclxuICAgIH1cclxuICAgIGlmIChhc3luY1ZhbGlkYXRvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLmZvcm1Hcm91cC5zZXRBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGUgZm9ybSBoYXMgZGVmYXVsdCB2YWx1ZXMsIHRoZXkgc2hvdWxkIGJlIGFwcGxpZWQgc3RyYWlnaHQgYXdheVxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwgPSB0aGlzLmdldERlZmF1bHRWYWx1ZXMoKTtcclxuXHJcbiAgICAvLyBnZXQgZGVmYXVsdCB2YWx1ZXMgZm9yIHJlc2V0LCBpZiBudWxsIGZhbGxiYWNrIHRvIHVuZGVmaW5lZCBhcyB0aGVyZSBzaSBhIGRpZmZlcmVuY2Ugd2hlbiBjYWxsaW5nIHJlc2V0XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZFZhbHVlID0gdGhpcy50cmFuc2Zvcm1Gcm9tRm9ybUdyb3VwKGRlZmF1bHRWYWx1ZXMgYXMgRm9ybUludGVyZmFjZSkgfHwgdW5kZWZpbmVkO1xyXG4gICAgLy8gc2luY2UgdGhpcyBpcyB0aGUgaW5pdGlhbCBzZXR0aW5nIG9mIGZvcm0gdmFsdWVzIGRvIE5PVCBlbWl0IGFuIGV2ZW50XHJcblxyXG4gICAgbGV0IG1lcmdlZFZhbHVlczogQ29udHJvbEludGVyZmFjZTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRyYW5zZm9ybWVkVmFsdWUpKSB7XHJcbiAgICAgIG1lcmdlZFZhbHVlcyA9IHN1YkZvcm0uY29udHJvbFZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgY29udHJvbFZhbHVlID0gKGRhdGFJbnB1dEhhc0NoYW5nZWQgPyAodGhpcyBhcyBhbnkpWydkYXRhSW5wdXQnXSA6IHN1YkZvcm0uY29udHJvbFZhbHVlKSB8fCB7fTtcclxuICAgICAgbWVyZ2VkVmFsdWVzID0geyAuLi50cmFuc2Zvcm1lZFZhbHVlLCAuLi5jb250cm9sVmFsdWUgfSBhcyBDb250cm9sSW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1WYWx1ZSA9IHRoaXMudHJhbnNmb3JtVG9Gb3JtR3JvdXAobWVyZ2VkVmFsdWVzLCB7fSk7XHJcbiAgICB0aGlzLmhhbmRsZUZvcm1BcnJheUNvbnRyb2xzKGZvcm1WYWx1ZSk7XHJcblxyXG4gICAgLy8gc2VsZiA9IGZhbHNlIGlzIGNyaXRpY2FsIGhlcmVcclxuICAgIC8vIHRoaXMgYWxsb3dzIHRoZSBwYXJlbnQgZm9ybSB0byByZS1ldmFsdWF0ZSBpdHMgc3RhdHVzIGFmdGVyIGVhY2ggb2YgaXRzIHN1YiBmb3JtIGhhcyBjb21wbGV0ZWQgaW50aWFsaXphdGlvblxyXG4gICAgLy8gd2UgYWN0dWFsbHkgb25seSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB0aGUgZGVlcGVzdCBzdWIgZm9ybSBpbiBhIHRyZWUgKGxlYXZlcylcclxuICAgIC8vIGJ1dCB0aGVyZSBpcyBubyB3YXkgdG8gaWRlbnRpZnkgaWYgdGhlcmUgYXJlIHN1YiBmb3JtcyBvbiB0aGUgY3VycmVudCBmb3JtICsgdGhhdCBhcmUgYWxzbyByZW5kZXJlZFxyXG4gICAgLy8gYXMgb25seSB3aGVuIHN1YiBmb3JtcyBhcmUgcmVuZGVyZWQgdGhlIG9uIGNoYW5nZXMgbWV0aG9kIG9uIHRoZSBzdWIgZm9ybSBpcyBleGVjdXRlZFxyXG5cclxuICAgIC8vIFRPRE8gZGVjaWRlIGlmIHdlIHdhbnQgdG8gZW1pdCBhbiBldmVudCB3aGVuIGlucHV0IGNvbnRyb2wgdmFsdWUgIT0gY29udHJvbCB2YWx1ZSBhZnRlciBpbnRpYWxpemF0aW9uXHJcbiAgICAvLyB0aGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgd2hlbiBudWxsIGlzIHBhc3NlZCBpbiBidXQgZGVmYXVsdCB2YWx1ZXMgY2hhbmdlIHRoZSB2YWx1ZSBvZiB0aGUgaW5uZXIgZm9ybVxyXG4gICAgdGhpcy5mb3JtR3JvdXAucmVzZXQobWVyZ2VkVmFsdWVzLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgbWFwQ29udHJvbHM8TWFwVmFsdWU+KFxyXG4gICAgbWFwQ29udHJvbDogTWFwQ29udHJvbEZ1bmN0aW9uPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlPixcclxuICAgIGZpbHRlckNvbnRyb2w6IEZpbHRlckNvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlPixcclxuICAgIHJlY3Vyc2l2ZUlmQXJyYXk6IGJvb2xlYW4sXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgKTogQ29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+IHwgbnVsbDtcclxuICBwcml2YXRlIG1hcENvbnRyb2xzPE1hcFZhbHVlPihcclxuICAgIG1hcENvbnRyb2w6IE1hcENvbnRyb2xGdW5jdGlvbjxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZT4sXHJcbiAgICBmaWx0ZXJDb250cm9sOiBGaWx0ZXJDb250cm9sRnVuY3Rpb248Rm9ybUludGVyZmFjZT4gPSAoKSA9PiB0cnVlLFxyXG4gICAgcmVjdXJzaXZlSWZBcnJheTogYm9vbGVhbiA9IHRydWUsXHJcbiAgKTogUGFydGlhbDxDb250cm9sTWFwPEZvcm1JbnRlcmZhY2UsIE1hcFZhbHVlIHwgTWFwVmFsdWVbXT4+IHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1Db250cm9sczogQ29udHJvbHNUeXBlPEZvcm1JbnRlcmZhY2U+ID0gdGhpcy5mb3JtR3JvdXAuY29udHJvbHM7XHJcblxyXG4gICAgY29uc3QgY29udHJvbHM6IFBhcnRpYWw8Q29udHJvbE1hcDxGb3JtSW50ZXJmYWNlLCBNYXBWYWx1ZSB8IE1hcFZhbHVlW10+PiA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGZvcm1Db250cm9scykge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuY29udHJvbHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBmb3JtQ29udHJvbHNba2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZUlmQXJyYXkgJiYgY29udHJvbCBpbnN0YW5jZW9mIEZvcm1BcnJheSkge1xyXG4gICAgICAgICAgY29uc3QgdmFsdWVzOiBNYXBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZXMucHVzaChtYXBDb250cm9sKGNvbnRyb2wuYXQoaSksIGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwICYmIHZhbHVlcy5zb21lKHggPT4gIWlzTnVsbE9yVW5kZWZpbmVkKHgpKSkge1xyXG4gICAgICAgICAgICBjb250cm9sc1trZXldID0gdmFsdWVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoY29udHJvbCAmJiBmaWx0ZXJDb250cm9sKGNvbnRyb2wsIGtleSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICBjb250cm9sc1trZXldID0gbWFwQ29udHJvbChjb250cm9sLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb250cm9scztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dGVuZCB0aGlzIG1ldGhvZCB0byBwcm92aWRlIGN1c3RvbSBsb2NhbCBGb3JtR3JvdXAgbGV2ZWwgdmFsaWRhdGlvblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBnZXRGb3JtR3JvdXBDb250cm9sT3B0aW9ucygpOiBGb3JtR3JvdXBPcHRpb25zPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gZ2V0RGVmYXVsdFZhbHVlcyBpcyBkZWZpbmVkLCB5b3UgZG8gbm90IG5lZWQgdG8gc3BlY2lmeSB0aGUgZGVmYXVsdCB2YWx1ZXNcclxuICAvLyBpbiB5b3VyIGZvcm0gKHRoZSBvbmVzIGRlZmluZWQgd2l0aGluIHRoZSBgZ2V0Rm9ybUNvbnRyb2xzYCBtZXRob2QpXHJcbiAgcHJvdGVjdGVkIGdldERlZmF1bHRWYWx1ZXMoKTogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFuZGxlRm9ybUFycmF5Q29udHJvbHMob2JqOiBhbnkpIHtcclxuICAgIC8vIFRPRE8gY2hlY2sgaWYgdGhpcyBjYW4gc3RpbGwgaGFwcGVuLCBpdCBhcHByZWFkZWQgZHVyaW5nIGRldmVsb3BtZW50LiBtaWdodCBhbGVyYWR5IGJlIGZpeGVkXHJcbiAgICBpZiAoIXRoaXMuZm9ybUdyb3VwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3QuZW50cmllcyhvYmopLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5mb3JtR3JvdXAuZ2V0KGtleSkgaW5zdGFuY2VvZiBGb3JtQXJyYXkgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBjb25zdCBmb3JtQXJyYXk6IEZvcm1BcnJheSA9IHRoaXMuZm9ybUdyb3VwLmdldChrZXkpIGFzIEZvcm1BcnJheTtcclxuXHJcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBjcmVhdGluZyBhIG5ldyBhcnJheSBldmVyeSB0aW1lIGFuZCBwdXNoIGEgbmV3IEZvcm1Db250cm9sXHJcbiAgICAgICAgLy8gd2UganVzdCByZW1vdmUgb3IgYWRkIHdoYXQgaXMgbmVjZXNzYXJ5IHNvIHRoYXQ6XHJcbiAgICAgICAgLy8gLSBpdCBpcyBhcyBlZmZpY2llbnQgYXMgcG9zc2libGUgYW5kIGRvIG5vdCBjcmVhdGUgdW5uZWNlc3NhcnkgRm9ybUNvbnRyb2wgZXZlcnkgdGltZVxyXG4gICAgICAgIC8vIC0gdmFsaWRhdG9ycyBhcmUgbm90IGRlc3Ryb3llZC9jcmVhdGVkIGFnYWluIGFuZCBldmVudHVhbGx5IGZpcmUgYWdhaW4gZm9yIG5vIHJlYXNvblxyXG4gICAgICAgIHdoaWxlIChmb3JtQXJyYXkubGVuZ3RoID4gdmFsdWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICBmb3JtQXJyYXkucmVtb3ZlQXQoZm9ybUFycmF5Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGZvcm1BcnJheS5sZW5ndGg7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCkpIHtcclxuICAgICAgICAgICAgZm9ybUFycmF5Lmluc2VydChpLCB0aGlzLmNyZWF0ZUZvcm1BcnJheUNvbnRyb2woa2V5IGFzIEFycmF5UHJvcGVydHlLZXk8Rm9ybUludGVyZmFjZT4sIHZhbHVlW2ldKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBjb250cm9sID0gbmV3IEZvcm1Db250cm9sKHZhbHVlW2ldKTtcclxuICAgICAgICAgICAgcGF0Y2hGb3JtQ29udHJvbCh0aGlzLmZvcm1Hcm91cCwgY29udHJvbCk7XHJcbiAgICAgICAgICAgIGZvcm1BcnJheS5pbnNlcnQoaSwgY29udHJvbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZm9ybUlzRm9ybVdpdGhBcnJheUNvbnRyb2xzKCk6IHRoaXMgaXMgTmd4Rm9ybVdpdGhBcnJheUNvbnRyb2xzPEZvcm1JbnRlcmZhY2U+IHtcclxuICAgIHJldHVybiB0eXBlb2YgKCh0aGlzIGFzIHVua25vd24pIGFzIE5neEZvcm1XaXRoQXJyYXlDb250cm9sczxGb3JtSW50ZXJmYWNlPikuY3JlYXRlRm9ybUFycmF5Q29udHJvbCA9PT0gJ2Z1bmN0aW9uJztcclxuICB9XHJcblxyXG4gIC8vIHdoZW4gY3VzdG9taXppbmcgdGhlIGVtaXNzaW9uIHJhdGUgb2YgeW91ciBzdWIgZm9ybSBjb21wb25lbnQsIHJlbWVtYmVyIG5vdCB0byAqKm11dGF0ZSoqIHRoZSBzdHJlYW1cclxuICAvLyBpdCBpcyBzYWZlIHRvIHRocm90dGxlLCBkZWJvdW5jZSwgZGVsYXksIGV0YyBidXQgdXNpbmcgc2tpcCwgZmlyc3QsIGxhc3Qgb3IgbXV0YXRpbmcgZGF0YSBpbnNpZGVcclxuICAvLyB0aGUgc3RyZWFtIHdpbGwgY2F1c2UgaXNzdWVzIVxyXG4gIHB1YmxpYyBoYW5kbGVFbWlzc2lvblJhdGUoKTogKG9icyQ6IE9ic2VydmFibGU8Q29udHJvbEludGVyZmFjZSB8IG51bGw+KSA9PiBPYnNlcnZhYmxlPENvbnRyb2xJbnRlcmZhY2UgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gb2JzJCA9PiBvYnMkO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIChvYmogYXMgYW55KSBhcyBGb3JtSW50ZXJmYWNlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhhdCBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gaWYgdGhlXHJcbiAgLy8gc2hhcGUgb2YgdGhlIGZvcm0gbmVlZHMgdG8gYmUgbW9kaWZpZWRcclxuICBwcm90ZWN0ZWQgdHJhbnNmb3JtRnJvbUZvcm1Hcm91cChmb3JtVmFsdWU6IEZvcm1JbnRlcmZhY2UpOiBDb250cm9sSW50ZXJmYWNlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKGZvcm1WYWx1ZSBhcyBhbnkpIGFzIENvbnRyb2xJbnRlcmZhY2U7XHJcbiAgfVxyXG59XHJcblxyXG5ARGlyZWN0aXZlKClcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBkaXJlY3RpdmUtY2xhc3Mtc3VmZml4XHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZ3hTdWJGb3JtUmVtYXBDb21wb25lbnQ8Q29udHJvbEludGVyZmFjZSwgRm9ybUludGVyZmFjZT4gZXh0ZW5kcyBOZ3hTdWJGb3JtQ29tcG9uZW50PFxyXG4gIENvbnRyb2xJbnRlcmZhY2UsXHJcbiAgRm9ybUludGVyZmFjZVxyXG4+IHtcclxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHJhbnNmb3JtVG9Gb3JtR3JvdXAoXHJcbiAgICBvYmo6IENvbnRyb2xJbnRlcmZhY2UgfCBudWxsLFxyXG4gICAgZGVmYXVsdFZhbHVlczogUGFydGlhbDxGb3JtSW50ZXJmYWNlPiB8IG51bGwsXHJcbiAgKTogRm9ybUludGVyZmFjZSB8IG51bGw7XHJcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHRyYW5zZm9ybUZyb21Gb3JtR3JvdXAoZm9ybVZhbHVlOiBGb3JtSW50ZXJmYWNlKTogQ29udHJvbEludGVyZmFjZSB8IG51bGw7XHJcbn1cclxuIl19