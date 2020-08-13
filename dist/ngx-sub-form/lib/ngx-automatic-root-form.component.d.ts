import { ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { NgxRootFormComponent } from './ngx-root-form.component';
export declare abstract class NgxAutomaticRootFormComponent<ControlInterface, FormInterface = ControlInterface> extends NgxRootFormComponent<ControlInterface, FormInterface> implements OnInit, OnDestroy {
    constructor(cd: ChangeDetectorRef);
    ngOnInit(): void;
}
