import { SubFormGroup } from './sub-form-group';
import {
  InjectionToken,
  Type,
  forwardRef,
  Directive,
  Input,
  Optional,
  OnInit,
  Self,
  Inject,
  Host,
} from '@angular/core';
import { subformComponentProviders } from './ngx-sub-form-utils';
import {
  NgControl,
  FormGroupDirective,
  NG_VALIDATORS,
  Validator,
  ValidatorFn,
  NG_ASYNC_VALIDATORS,
  AsyncValidator,
  AsyncValidatorFn,
} from '@angular/forms';

export interface SubFormProvider<TControl, TForm> {
  initFormGroup(formGroup: SubFormGroup<TControl, TForm>): void;
}

export const SUB_FORM_PROVIDER = new InjectionToken<SubFormProvider<any, any>>('SUB_FORM_PROVIDER');

export function generateSubFormProviders(
  component: any,
): {
  provide: InjectionToken<any>;
  useExisting: Type<any>;
  multi?: boolean;
}[] {
  return [
    // TODO remove legacy
    ...subformComponentProviders(component),
    {
      provide: SUB_FORM_PROVIDER,
      useExisting: forwardRef(() => component),
    },
  ];
}

const formDirectiveProvider: any = {
  provide: NgControl,
  // tslint:disable-next-line: no-use-before-declare
  useExisting: forwardRef(() => SubFormGroupDirective),
};

@Directive({
  selector: '[subFormGroup]',
  providers: [formDirectiveProvider],
  host: { '(submit)': 'onSubmit($event)', '(reset)': 'onReset()' },
  exportAs: 'ngForm',
})
export class SubFormGroupDirective<TControl, TForm> extends FormGroupDirective implements OnInit {
  @Input('subFormGroup') form!: SubFormGroup<TControl, TForm>;

  constructor(
    @Optional()
    @Self()
    @Inject(NG_VALIDATORS)
    validators: Array<Validator | ValidatorFn>,
    @Optional()
    @Self()
    @Inject(NG_ASYNC_VALIDATORS)
    asyncValidators: Array<AsyncValidator | AsyncValidatorFn>,
    @Host()
    @Inject(SUB_FORM_PROVIDER)
    private subForm: SubFormProvider<TControl, TForm>,
  ) {
    super(validators, asyncValidators);
  }

  ngOnInit() {
    this.subForm.initFormGroup(this.form);
  }
}
