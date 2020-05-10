import { OnInit, OnDestroy } from '@angular/core';
import { NgxRootFormComponent } from './ngx-root-form.component';
import { takeUntilDestroyed } from './ngx-sub-form-utils';
import { filter, tap } from 'rxjs/operators';

type FormGroupStatus = 'DISABLED' | 'PENDING' | 'INVALID' | 'VALID';

export abstract class NgxAutomaticRootFormComponent<ControlInterface, FormInterface = ControlInterface>
  extends NgxRootFormComponent<ControlInterface, FormInterface>
  implements OnInit, OnDestroy {
  ngOnInit() {
    super.ngOnInit();

    this.formGroup.statusChanges
      .pipe(
        takeUntilDestroyed(this),
        filter((status: FormGroupStatus) => status === 'VALID'),
        tap(() => this.manualSave()),
      )
      .subscribe();
  }
}
