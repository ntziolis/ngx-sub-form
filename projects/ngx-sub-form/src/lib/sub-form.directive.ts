import { ChangeDetectorRef, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';

import { SubFormGroup } from './sub-form-group';

@Directive({
  selector: '[subForm]',
})
export class SubFormDirective<TControl, TForm> implements OnChanges {
  @Input() subForm!: SubFormGroup<TControl, TForm>;

  constructor(private cd: ChangeDetectorRef) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.subForm && this.subForm) {
      console.log('SubFormDirective sub-form ngOnChanges');
      this.subForm.setChangeDetector(this.cd);
      //this.cd.markForCheck();
    }
  }
}
