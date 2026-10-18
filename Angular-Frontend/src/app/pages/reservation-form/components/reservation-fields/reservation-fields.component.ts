import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { ServiceListDTO } from '../../../../models/dto/service-list-dto';
import { ActivationStatus } from '../../../../models/enums/activation-status';
import { ReservationStatus } from '../../../../models/enums/reservation-status';

export function createReservationForm() {
  return new FormGroup({
    checkIn: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    checkOut: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    guests: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    }),
    roomTypeId: new FormControl(0, {
      nonNullable: true,
      validators: Validators.min(1),
    }),
    status: new FormControl(ReservationStatus.PENDING, {
      nonNullable: true,
      validators: Validators.required,
    }),
    serviceIds: new FormControl<number[]>([], { nonNullable: true }),
  });
}

@Component({
  selector: 'app-reservation-fields',
  imports: [ReactiveFormsModule, FormFieldComponent, CurrencyPipe],
  templateUrl: './reservation-fields.component.html',
  styleUrl: './reservation-fields.component.scss',
})
export class ReservationFieldsComponent {
  @Input({ required: true }) form = createReservationForm();
  @Input() roomTypes: RoomTypeListDTO[] = [];
  @Input() services: ServiceListDTO[] = [];
  @Input() originalServiceIds: number[] = [];
  @Input() submitted = false;
  readonly statuses = Object.values(ReservationStatus);
  readonly active = ActivationStatus.ACTIVE;
  toggleService(id: number, checked: boolean): void {
    const current = this.form.controls.serviceIds.value;
    this.form.controls.serviceIds.setValue(
      checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id),
    );
    this.form.controls.serviceIds.markAsDirty();
  }
}
