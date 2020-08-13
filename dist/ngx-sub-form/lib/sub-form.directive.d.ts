import { ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { SubFormGroup } from './sub-form-group';
export declare class SubFormDirective<TControl, TForm> implements OnChanges {
    private cd;
    subForm: SubFormGroup<TControl, TForm>;
    constructor(cd: ChangeDetectorRef);
    ngOnChanges(changes: SimpleChanges): void;
}
