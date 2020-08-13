/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AbstractControlOptions, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
export declare function coerceToValidator(validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): ValidatorFn | null;
export declare function coerceToAsyncValidator(asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null, validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null): AsyncValidatorFn | null;
