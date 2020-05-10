import { EventEmitter, OnInit, Input } from '@angular/core';
import isEqual from 'fast-deep-equal';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
import { takeUntilDestroyed, isNullOrUndefined } from './ngx-sub-form-utils';
import { SubFormGroup } from './sub-form-group';
import { FormGroup } from '@angular/forms';

export abstract class NgxRootFormComponent<ControlInterface, FormInterface = ControlInterface>
  extends NgxSubFormRemapComponent<ControlInterface, FormInterface>
  implements OnInit {
  public abstract dataInput: Required<ControlInterface> | null | undefined;
  // `Input` values are set while the `ngOnChanges` hook is ran
  // and it does happen before the `ngOnInit` where we start
  // listening to `dataInput$`. Therefore, it cannot be a `Subject`
  // or we will miss the first value
  protected dataInput$: BehaviorSubject<Required<ControlInterface> | null | undefined> = new BehaviorSubject<
    Required<ControlInterface> | null | undefined
  >(null);

  public abstract dataOutput: EventEmitter<ControlInterface>;
  // using a private variable `_dataOutput$` to be able to control the
  // emission rate with a debounce or throttle for ex
  /** @internal */
  protected _dataOutput$: Subject<ControlInterface> = new Subject();

  protected emitInitialValueOnInit = false;
  protected emitNullOnDestroy = false;

  protected dataValue: ControlInterface | null = null;

  constructor() {
    super();
    this.formGroup = new SubFormGroup<ControlInterface, FormInterface>({}) as any;
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this.dataInput$
      .pipe(
        filter(newValue => !isEqual(newValue, this.formGroup.value)),
        tap(newValue => {
          if (!isNullOrUndefined(newValue)) {
            this.formGroup.patchValue(newValue);
          }
        }),
        takeUntilDestroyed(this),
      )
      .subscribe();

    this._dataOutput$
      .pipe(
        filter(() => this.formGroup.valid),
        tap(value => this.dataOutput.emit(value)),
        takeUntilDestroyed(this),
      )
      .subscribe();
  }

  /** @internal */
  protected onRegisterOnChangeHook(data: ControlInterface | null): boolean {
    if (this.formGroup.invalid || isEqual(data, this.dataInput$.value)) {
      return false;
    }

    this.dataValue = data;
    return true;
  }

  // called by the DataInput decorator
  /** @internal */
  public dataInputUpdated(data: Required<ControlInterface> | null | undefined): void {
    this.dataInput$.next(data);
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
    this.dataValue = this.formGroup.value as any;
    if (!isNullOrUndefined(this.dataValue) && this.formGroup.valid) {
      this._dataOutput$.next(this.dataValue);
    }
  }
}
