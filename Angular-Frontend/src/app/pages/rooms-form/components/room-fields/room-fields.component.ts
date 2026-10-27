import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { RoomTypeOptionDTO } from '../../../../models/dto/room-type-option-dto';
import { ActivationStatus } from '../../../../models/enums/activation-status';
import { RoomStatus } from '../../../../models/enums/room-status';
import { ROOM_MESSAGES } from '../../../../utils/form-messages';

@Component({
  selector: 'app-room-fields',
  imports: [ReactiveFormsModule, FormFieldComponent, TranslocoPipe],
  templateUrl: './room-fields.component.html',
  styleUrl: './room-fields.component.scss',
})
export class RoomFieldsComponent {
  readonly activationStatuses = Object.values(ActivationStatus);
  @Input({ required: true }) form?: FormGroup<{
    number: FormControl<number | null>;
    floor: FormControl<number | null>;
    status: FormControl<RoomStatus>;
    activationStatus: FormControl<ActivationStatus>;
    roomTypeId: FormControl<number | null>;
  }>;
  @Input({ required: true }) roomTypes: RoomTypeOptionDTO[] = [];
  @Input() submitted = false;
  readonly statuses = Object.values(RoomStatus);
  protected readonly messages = ROOM_MESSAGES;
  invalid(control: FormControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }
}
