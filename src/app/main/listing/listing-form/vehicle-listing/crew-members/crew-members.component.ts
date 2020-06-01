import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  ArrayPropertyKey,
  ArrayPropertyValue,
  Controls,
  NgxFormWithArrayControls,
  NgxSubFormRemapComponent,
  SubFormArray,
  subformComponentProviders,
  SubFormGroup,
} from 'ngx-sub-form';

import { CrewMember } from '../../../../../interfaces/crew-member.interface';

interface CrewMembersForm {
  crewMembers: CrewMember[];
}

@Component({
  selector: 'app-crew-members',
  templateUrl: './crew-members.component.html',
  styleUrls: ['./crew-members.component.scss'],
  providers: subformComponentProviders(CrewMembersComponent),
})
export class CrewMembersComponent extends NgxSubFormRemapComponent<CrewMember[], CrewMembersForm>
  implements NgxFormWithArrayControls<CrewMembersForm> {
  protected getFormControls(): Controls<CrewMembersForm> {
    return {
      crewMembers: new SubFormArray(this, []),
    };
  }

  public getDefaultValues(): Partial<CrewMembersForm> {
    return {
      crewMembers: [],
    };
  }

  protected transformToFormGroup(obj: CrewMember[] | null): CrewMembersForm | null {
    return {
      crewMembers: !obj ? [] : obj,
    };
  }

  protected transformFromFormGroup(formValue: CrewMembersForm): CrewMember[] | null {
    return formValue.crewMembers;
  }

  public removeCrewMember(index: number): void {
    this.formGroup.controls.crewMembers.removeAt(index);
  }

  public addCrewMember(): void {
    this.formGroup.controls.crewMembers.push(
      this.createFormArrayControl('crewMembers', {
        firstName: '',
        lastName: '',
      }),
    );
  }

  // following method is not required and return by default a simple FormControl
  // if needed, you can use the `createFormArrayControl` hook to customize the creation
  // of your `FormControl`s that will be added to the `FormArray`
  public createFormArrayControl(
    key: ArrayPropertyKey<CrewMembersForm> | undefined,
    value: ArrayPropertyValue<CrewMembersForm>,
  ): FormControl {
    switch (key) {
      // note: the following string is type safe based on your form properties!
      case 'crewMembers':
        return new SubFormGroup(value, [Validators.required]) as any;
      default:
        return new SubFormGroup(value) as any;
    }
  }
}
