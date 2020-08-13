import { OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { NgxRootFormComponent } from './ngx-root-form.component';
import { takeUntilDestroyed } from './ngx-sub-form-utils';
import { filter, tap, startWith } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';

type FormGroupStatus = 'DISABLED' | 'PENDING' | 'INVALID' | 'VALID';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class NgxAutomaticRootFormComponent<ControlInterface, FormInterface = ControlInterface>
  extends NgxRootFormComponent<ControlInterface, FormInterface>
  implements OnInit, OnDestroy {
  constructor(@Optional() cd: ChangeDetectorRef) {
    super(cd);
  }

  ngOnInit() {
    super.ngOnInit();

    const status$ = this.formGroup.statusChanges.pipe(startWith(this.formGroup.status)) as Observable<FormGroupStatus>;

    const value$ = this.formGroup.valueChanges.pipe(startWith(this.formGroup.value));

    combineLatest([status$, value$])
      .pipe(
        takeUntilDestroyed(this),
        filter(([status, value]) => status === 'VALID'),
        tap(() => this.manualSave()),
      )
      .subscribe();
  }
}
