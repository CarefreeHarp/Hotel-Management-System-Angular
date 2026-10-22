import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import {
  MAX_NIGHTS,
  addDays,
  latestCheckIn,
  localDate,
  stayNights,
} from '../../../../models/booking';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { ServiceListDTO } from '../../../../models/dto/service-list-dto';
import { ActivationStatus } from '../../../../models/enums/activation-status';
import { ReservationStatus } from '../../../../models/enums/reservation-status';
import {
  FieldMessages,
  RESERVATION_MESSAGES,
} from '../../../../utils/form-messages';
import { wholeNumber } from '../../../../utils/form-validators';

/** Datos de la reserva y de los tipos que las reglas necesitan al validar. */
export interface ReservationLimits {
  // Llegada guardada: si no cambia, puede seguir en el pasado (estancias en curso o terminadas).
  originalCheckIn: () => string | undefined;
  capacity: (roomTypeId: number) => number | undefined;
  balance?: () => number;
}

const noLimits: ReservationLimits = {
  originalCheckIn: () => undefined,
  capacity: () => undefined,
};

// Mismas reglas de fechas y huéspedes que BookingService.update() en el backend.
function checkInRule(limits: ReservationLimits): ValidatorFn {
  return (control) => {
    const value: string = control.value;
    if (!value) return null;
    if (value !== limits.originalCheckIn() && value < localDate())
      return { past: true };
    return value > latestCheckIn() ? { tooFar: true } : null;
  };
}

function checkOutRule(control: AbstractControl): ValidationErrors | null {
  const checkIn: string | undefined = control.parent?.get('checkIn')?.value;
  const value: string = control.value;
  if (!value || !checkIn) return null;
  if (value <= checkIn) return { order: true };
  return stayNights(checkIn, value) > MAX_NIGHTS ? { tooLong: true } : null;
}

function capacityRule(limits: ReservationLimits): ValidatorFn {
  return (control) => {
    const capacity = limits.capacity(control.parent?.get('roomTypeId')?.value);
    return capacity !== undefined && control.value > capacity
      ? { capacity: true }
      : null;
  };
}

function checkOutBalanceRule(limits: ReservationLimits): ValidatorFn {
  return (control) =>
    control.value === ReservationStatus.CHECKED_OUT &&
      Math.round((limits.balance?.() ?? 0) * 100) > 0
      ? { unpaid: true }
      : null;
}

export function createReservationForm(limits: ReservationLimits = noLimits) {
  const form = new FormGroup({
    checkIn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, checkInRule(limits)],
    }),
    checkOut: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, checkOutRule],
    }),
    guests: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        wholeNumber,
        capacityRule(limits),
      ],
    }),
    roomTypeId: new FormControl(0, {
      nonNullable: true,
      validators: Validators.min(1),
    }),
    status: new FormControl(ReservationStatus.PENDING, {
      nonNullable: true,
      validators: [Validators.required, checkOutBalanceRule(limits)],
    }),
    serviceIds: new FormControl<number[]>([], { nonNullable: true }),
  });
  // Se crea en el contexto del componente. Sus flujos terminan con él.
  // Las reglas que comparan dos campos se recalculan cuando cambia el otro.
  form.controls.checkIn.valueChanges.pipe(takeUntilDestroyed()).subscribe(() =>
    form.controls.checkOut.updateValueAndValidity(),
  );
  form.controls.roomTypeId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() =>
    form.controls.guests.updateValueAndValidity(),
  );
  // Fechas, tipo y servicios pueden cambiar el saldo antes de guardar.
  form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() =>
    form.controls.status.updateValueAndValidity({ emitEvent: false }),
  );
  return form;
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
  protected readonly messages = RESERVATION_MESSAGES;
  // El selector de fechas solo ofrece fechas que las reglas aceptan.
  readonly today = localDate();
  readonly lastCheckIn = latestCheckIn();
  get firstCheckOut(): string | null {
    const checkIn = this.form.controls.checkIn.value;
    return checkIn ? addDays(checkIn, 1) : null;
  }
  get lastCheckOut(): string | null {
    const checkIn = this.form.controls.checkIn.value;
    return checkIn ? addDays(checkIn, MAX_NIGHTS) : null;
  }
  get capacity(): number | null {
    const roomTypeId = this.form.controls.roomTypeId.value;
    return (
      this.roomTypes.find((type) => type.roomTypeId === roomTypeId)
        ?.maxCapacity ?? null
    );
  }
  get guestMessages(): FieldMessages {
    return {
      ...this.messages.guests,
      capacity: `This room type accommodates at most ${this.capacity} guests. Please reduce the number of guests or choose another room type.`,
    };
  }
  invalid(control: FormControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }
  toggleService(id: number, checked: boolean): void {
    const current = this.form.controls.serviceIds.value;
    this.form.controls.serviceIds.setValue(
      checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id),
    );
    // setValue vuelve a validar el control y quita el error del backend sobre los servicios.
    this.form.controls.serviceIds.markAsDirty();
  }
}
