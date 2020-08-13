import { ChangeDetectorRef, Directive, OnDestroy, OnInit, Optional } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';

import { NgxRootFormComponent } from './ngx-root-form.component';
import { takeUntilDestroyed } from './ngx-sub-form-utils';

type FormGroupStatus = 'DISABLED' | 'PENDING' | 'INVALID' | 'VALID';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class NgxAutomaticRootFormComponent<ControlInterface, FormInterface = ControlInterface>
  extends NgxRootFormComponent<ControlInterface, FormInterface>
  implements OnInit, OnDestroy {
  constructor(cd: ChangeDetectorRef) {
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
