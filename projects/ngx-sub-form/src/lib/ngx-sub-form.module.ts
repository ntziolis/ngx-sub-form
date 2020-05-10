import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubFormGroupDirective } from './sub-form.directive';

@NgModule({
  declarations: [SubFormGroupDirective],
  imports: [CommonModule],
  exports: [SubFormGroupDirective],
})
export class NgxSubFormModule {}
