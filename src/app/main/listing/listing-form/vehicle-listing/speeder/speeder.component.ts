import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Controls, NgxSubFormComponent, SubFormGroup } from 'ngx-sub-form';
import { Speeder, VehicleType } from 'src/app/interfaces/vehicle.interface';

@Component({
  selector: 'app-speeder',
  templateUrl: './speeder.component.html',
  styleUrls: ['./speeder.component.scss'],
})
export class SpeederComponent extends NgxSubFormComponent<Speeder> {
  protected getFormControls(): Controls<Speeder> {
    return {
      color: new FormControl(null, { validators: [Validators.required] }),
      canFire: new FormControl(null, { validators: [Validators.required] }),
      crewMembers: new SubFormGroup(null, { validators: [Validators.required] }),
      vehicleType: new FormControl(null, { validators: [Validators.required] }),
      maximumSpeed: new FormControl(null, { validators: [Validators.required] }),
    };
  }

  protected getDefaultValues(): Partial<Speeder> {
    return { vehicleType: VehicleType.SPEEDER, canFire: false };
  }
}
