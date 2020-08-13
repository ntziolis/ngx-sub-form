import { ChangeDetectorRef, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
export declare abstract class NgxRootFormComponent<ControlInterface, FormInterface = ControlInterface> extends NgxSubFormRemapComponent<ControlInterface, FormInterface> implements OnInit, OnDestroy {
    abstract dataInput: Required<ControlInterface> | null | undefined;
    abstract dataOutput: EventEmitter<ControlInterface>;
    protected emitInitialValueOnInit: boolean;
    protected emitNullOnDestroy: boolean;
    protected dataValue: ControlInterface | null;
    constructor(cd: ChangeDetectorRef);
    ngOnDestroy(): void;
    ngOnInit(): void;
    protected transformToFormGroup(obj: ControlInterface | null, defaultValues: Partial<FormInterface> | null): FormInterface | null;
    protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
    manualSave(): void;
}
