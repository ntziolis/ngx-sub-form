import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Controls, NgxSubFormComponent } from 'ngx-sub-form';

import { OneVehicleForm } from '../../app/main/listing/listing-form/vehicle-listing/vehicle-product.component';

@Component({
  selector: 'app-vehicle-product',
  templateUrl: './vehicle-product.component.html',
  styleUrls: ['./vehicle-product.component.scss'],
})
export class VehicleProductComponent extends NgxSubFormComponent<OneVehicleForm> {
  protected getFormControls(): Controls<OneVehicleForm> {
    return {
      speeder: new FormControl(null),
      spaceship: new FormControl(null),
      vehicleType: new FormControl(null, { validators: [Validators.required] }),
    };
  }
}
