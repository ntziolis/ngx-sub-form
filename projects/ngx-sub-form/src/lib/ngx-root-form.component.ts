import { Directive, EventEmitter, OnInit, Optional, ChangeDetectorRef, OnDestroy } from '@angular/core';
import isEqual from 'fast-deep-equal';
import { Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { isNullOrUndefined, takeUntilDestroyed } from './ngx-sub-form-utils';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
import { TypedSubFormGroup } from './ngx-sub-form.types';
import { SubFormGroup } from './sub-form-group';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class NgxRootFormComponent<ControlInterface, FormInterface = ControlInterface>
  extends NgxSubFormRemapComponent<ControlInterface, FormInterface>
  implements OnInit, OnDestroy {
  public abstract dataInput: Required<ControlInterface> | null | undefined;

  public abstract dataOutput: EventEmitter<ControlInterface>;
  // using a private variable `_dataOutput$` to be able to control the
  // emission rate with a debounce or throttle for ex
  /** @internal */
  protected _dataOutput$: Subject<ControlInterface> = new Subject();

  protected emitInitialValueOnInit = false;
  protected emitNullOnDestroy = false;

  protected dataValue: ControlInterface | null = null;

  // change detector only needs to be passed from root form
  // for sub forms the sub-form-directive injects the change detector ref for us
  constructor(@Optional() cd?: ChangeDetectorRef) {
    super();
    this.formGroup = new SubFormGroup<ControlInterface, FormInterface>({}) as TypedSubFormGroup<
      ControlInterface,
      FormInterface
    >;

    if (cd) {
      this.formGroup.setChangeDetector(cd);
    }
  }

  // needed for take until destroyed
  ngOnDestroy(): void {    
  }

  public ngOnInit(): void {
    this._dataOutput$
      .pipe(
        takeUntilDestroyed(this),
        filter(() => this.formGroup.valid),
        tap(value => this.dataOutput.emit(value)),
      )
      .subscribe();
  }

  /** @internal */
  protected onRegisterOnChangeHook(data: ControlInterface | null): boolean {
    if (this.formGroup.invalid || isEqual(data, this.dataInput)) {
      return false;
    }

    this.dataValue = data;
    return true;
  }

  protected transformToFormGroup(
    obj: ControlInterface | null,
    defaultValues: Partial<FormInterface> | null,
  ): FormInterface | null {
    return (obj as unknown) as FormInterface;
  }

  protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null {
    return (formValue as unknown) as ControlInterface;
  }

  public manualSave(): void {
    // if (this.formGroup.valid) {
    //   this.dataValue = this.formGroup.controlValue;
    //   this._dataOutput$.next(this.dataValue);
    // }
    this.dataValue = this.formGroup.controlValue as ControlInterface;
    if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
      this._dataOutput$.next(this.dataValue);
    }
  }
}
