import { EventEmitter, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NgxSubFormRemapComponent } from './ngx-sub-form.component';
export declare abstract class NgxRootFormComponent<ControlInterface, FormInterface = ControlInterface> extends NgxSubFormRemapComponent<ControlInterface, FormInterface> implements OnInit {
    abstract dataInput: Required<ControlInterface> | null | undefined;
    protected dataInput$: BehaviorSubject<Required<ControlInterface> | null | undefined>;
    abstract dataOutput: EventEmitter<ControlInterface>;
    set disabled(shouldDisable: boolean | undefined);
    protected emitInitialValueOnInit: boolean;
    protected emitNullOnDestroy: boolean;
    protected dataValue: ControlInterface | null;
    ngOnInit(): void;
    writeValue(obj: Required<ControlInterface> | null): void;
    protected transformToFormGroup(obj: ControlInterface | null, defaultValues: Partial<FormInterface> | null): FormInterface | null;
    protected transformFromFormGroup(formValue: FormInterface): ControlInterface | null;
    manualSave(): void;
}
