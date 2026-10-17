import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { RoomTypeOptionDTO } from '../../../../models/dto/room-type-option-dto';
import { RoomStatus } from '../../../../models/enums/room-status';

@Component({
  selector: 'app-room-fields',
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: './room-fields.component.html',
  styleUrl: './room-fields.component.scss',
})
export class RoomFieldsComponent {
  @Input({ required: true }) form!: FormGroup<{
    number: FormControl<number | null>;
    floor: FormControl<number | null>;
    status: FormControl<RoomStatus>;
    roomTypeId: FormControl<number | null>;
  }>;
  @Input({ required: true }) roomTypes: RoomTypeOptionDTO[] = [];
  @Input() submitted = false;
  readonly statuses = [
    RoomStatus.AVAILABLE,
    RoomStatus.OCCUPIED,
    RoomStatus.MAINTENANCE,
  ];
  error(control: FormControl): string {
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('integer')) return 'Enter a whole number.';
    if (control.hasError('min'))
      return 'Minimum value: ' + control.getError('min').min + '.';
    if (control.hasError('max'))
      return 'Maximum value: ' + control.getError('max').max + '.';
    return 'Check this value.';
  }
  invalid(control: FormControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }
}
