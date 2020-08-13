// The following code is copied from angular source since those methods tehy are not exported
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  AbstractControlOptions,
  AsyncValidator,
  AsyncValidatorFn,
  Validator,
  ValidatorFn,
  Validators,
  AbstractControl,
} from '@angular/forms';

// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/directives/shared.ts
function composeValidators(validators: Array<Validator | ValidatorFn>): ValidatorFn | null {
  return validators != null ? Validators.compose(validators.map(normalizeValidator)) : null;
}
function composeAsyncValidators(validators: Array<AsyncValidator | AsyncValidatorFn>): AsyncValidatorFn | null {
  return validators != null ? Validators.composeAsync(validators.map(normalizeAsyncValidator)) : null;
}

function normalizeValidator(validator: ValidatorFn | Validator): ValidatorFn {
  // thorws error in latest typescript version
  //if ((<Validator>validator).validate) {
  if ((<any>validator).validate) {
    return (c: AbstractControl) => (<Validator>validator).validate(c);
  } else {
    return <ValidatorFn>validator;
  }
}

function normalizeAsyncValidator(validator: AsyncValidatorFn | AsyncValidator): AsyncValidatorFn {
  // thorws error in latest typescript version
  //if ((<AsyncValidator>validator).validate) {
  if ((<any>validator).validate) {
    return (c: AbstractControl) => (<AsyncValidator>validator).validate(c);
  } else {
    return <AsyncValidatorFn>validator;
  }
}

// https://github.com/angular/angular/blob/0075017b43a37d06780cc245c3326212d15fd6bd/packages/forms/src/model.ts
function isOptionsObj(validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): boolean {
  return validatorOrOpts != null && !Array.isArray(validatorOrOpts) && typeof validatorOrOpts === 'object';
}
export function coerceToValidator(
  validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
): ValidatorFn | null {
  const validator = (isOptionsObj(validatorOrOpts)
    ? (validatorOrOpts as AbstractControlOptions).validators
    : validatorOrOpts) as ValidatorFn | ValidatorFn[] | null;

  return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}

export function coerceToAsyncValidator(
  asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
  validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null,
): AsyncValidatorFn | null {
  const origAsyncValidator = (isOptionsObj(validatorOrOpts)
    ? (validatorOrOpts as AbstractControlOptions).asyncValidators
    : asyncValidator) as AsyncValidatorFn | AsyncValidatorFn | null;

  return Array.isArray(origAsyncValidator) ? composeAsyncValidators(origAsyncValidator) : origAsyncValidator || null;
}
