import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubFormDirective } from './sub-form.directive';



@NgModule({
  declarations: [
    SubFormDirective
  ],
  imports: [
    CommonModule,    
  ],
  exports: [
    SubFormDirective
  ]
})
export class NgxSubFormModule { }
