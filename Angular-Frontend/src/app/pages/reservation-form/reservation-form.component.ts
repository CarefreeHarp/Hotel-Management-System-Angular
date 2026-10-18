import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ReservationDetails } from '../../models/booking';
import { RoomTypeListDTO } from '../../models/dto/room-type-list-dto';
import { ServiceListDTO } from '../../models/dto/service-list-dto';
import { ReservationService } from '../../services/reservation.service';
import { RoomTypeService } from '../../services/room-type.service';
import { ServiceService } from '../../services/service.service';
import { basePath } from '../../utils/base-path';
import {
  createReservationForm,
  ReservationFieldsComponent,
} from './components/reservation-fields/reservation-fields.component';

@Component({
  selector: 'app-reservation-form',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    ButtonComponent,
    PageHeadingComponent,
    ReservationFieldsComponent,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
})
export class ReservationFormComponent {
  private readonly reservations = inject(ReservationService);
  private readonly types = inject(RoomTypeService);
  private readonly hotelServices = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = createReservationForm();
  detail: ReservationDetails | undefined;
  roomTypes: RoomTypeListDTO[] = [];
  services: ServiceListDTO[] = [];
  originalServiceIds: number[] = [];
  loading = true;
  saving = false;
  submitted = false;
  error = '';
  get base(): string {
    return basePath(this.route);
  }
  get previewTotal(): number {
    const detail = this.detail;
    if (!detail) return 0;
    const draft = this.form.getRawValue();
    const nights = Math.max(
      0,
      (Date.parse(draft.checkOut) - Date.parse(draft.checkIn)) / 86400000,
    );
    const rate =
      draft.roomTypeId === detail.reservation.roomTypeId
        ? detail.nightlyPrice
        : (this.roomTypes.find((type) => type.roomTypeId === draft.roomTypeId)
            ?.nightlyPrice ?? 0);
    const charges = detail.charges
      .filter(
        (charge) =>
          charge.serviceId === undefined ||
          draft.serviceIds.includes(charge.serviceId),
      )
      .reduce((sum, charge) => sum + charge.subtotal, 0);
    const additions = this.services
      .filter(
        (service) =>
          draft.serviceIds.includes(service.serviceId) &&
          !this.originalServiceIds.includes(service.serviceId),
      )
      .reduce((sum, service) => sum + service.price, 0);
    return (Number.isFinite(nights) ? nights : 0) * rate + charges + additions;
  }
  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading = true;
          this.error = '';
          this.detail = undefined;
          this.submitted = false;
          const id = Number(params.get('id'));
          if (!Number.isSafeInteger(id) || id < 1) {
            this.error = 'Reservation not found.';
            return of(undefined);
          }
          return forkJoin({
            detail: this.reservations.details(id),
            roomTypes: this.types.getAll(),
            services: this.hotelServices.getAll(),
          }).pipe(
            catchError(() => {
              this.error =
                'Unable to load reservation information. Please try again.';
              return of(undefined);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.loading = false;
        if (!data) return;
        this.detail = data.detail;
        this.roomTypes = data.roomTypes;
        this.services = data.services;
        this.originalServiceIds = data.detail.charges.flatMap((charge) =>
          charge.serviceId === undefined ? [] : [charge.serviceId],
        );
        const item = data.detail.reservation;
        this.form.reset({
          checkIn: item.checkInDate,
          checkOut: item.checkOutDate,
          guests: item.guestCount,
          roomTypeId: item.roomTypeId ?? 0,
          status: item.status,
          serviceIds: this.originalServiceIds,
        });
      });
  }
  save(): void {
    if (this.saving || this.loading || !this.detail) return;
    this.submitted = true;
    this.error = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Please check the required fields.';
      return;
    }
    const draft = this.form.getRawValue();
    if (draft.checkOut <= draft.checkIn) {
      this.error = 'The check-out date must be after the check-in date.';
      return;
    }
    const id = this.detail.reservation.reservationId;
    this.saving = true;
    this.reservations
      .update(id, draft)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate([this.base, 'reservations', id], {
            queryParams: { saved: true },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.error =
            error.error?.message ||
            'Unable to save this reservation. Please try again.';
        },
      });
  }
}
