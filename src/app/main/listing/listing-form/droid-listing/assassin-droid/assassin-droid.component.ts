import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Controls, NgxSubFormComponent, subformComponentProviders } from 'ngx-sub-form';
import { AssassinDroid, AssassinDroidWeapon, DroidType } from 'src/app/interfaces/droid.interface';

export const ASSASSIN_DROID_WEAPON_TEXT: { [K in AssassinDroidWeapon]: string } = {
  [AssassinDroidWeapon.SABER]: 'Saber',
  [AssassinDroidWeapon.FLAME_THROWER]: 'Flame thrower',
  [AssassinDroidWeapon.GUN]: 'Gun',
  [AssassinDroidWeapon.AXE]: 'Axe',
};

@Component({
  selector: 'app-assassin-droid',
  templateUrl: './assassin-droid.component.html',
  styleUrls: ['./assassin-droid.component.scss'],
  providers: subformComponentProviders(AssassinDroidComponent),
})
export class AssassinDroidComponent extends NgxSubFormComponent<AssassinDroid> {
  public AssassinDroidWeapon = AssassinDroidWeapon;

  public assassinDroidWeaponText = ASSASSIN_DROID_WEAPON_TEXT;

  protected getFormControls(): Controls<AssassinDroid> {
    return {
      color: new FormControl(null, { validators: [Validators.required] }),
      name: new FormControl(null, { validators: [Validators.required] }),
      droidType: new FormControl(null, { validators: [Validators.required] }),
      weapons: new FormControl(null, { validators: [Validators.required] }),
    };
  }

  public getDefaultValues(): Partial<AssassinDroid> {
    return {
      droidType: DroidType.ASSASSIN,
      weapons: [],
    };
  }
}
