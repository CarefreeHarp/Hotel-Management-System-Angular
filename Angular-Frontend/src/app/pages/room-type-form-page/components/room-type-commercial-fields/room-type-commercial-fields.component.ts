import { Component, Input } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { ROOM_TYPE_MESSAGES } from '../../../../utils/form-messages';
import type { RoomTypeForm } from '../../room-type-form-page.component';

@Component({
  selector: 'app-room-type-commercial-fields',
  imports: [FormFieldComponent],
  templateUrl: './room-type-commercial-fields.component.html',
  styleUrl: './room-type-commercial-fields.component.scss',
})
export class RoomTypeCommercialFieldsComponent {
  @Input({ required: true }) form?: RoomTypeForm;
  @Input() submitted = false;
  protected readonly messages = ROOM_TYPE_MESSAGES;
}
