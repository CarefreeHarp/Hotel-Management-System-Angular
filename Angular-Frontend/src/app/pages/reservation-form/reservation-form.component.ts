import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  catchError,
  combineLatest,
  EMPTY,
  exhaustMap,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ReservationContentComponent } from '../../components/reservation-content/reservation-content.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { canModifyReservation, ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { RoomTypeListDTO } from '../../models/dto/room-type-list-dto';
import { ServiceListDTO } from '../../models/dto/service-list-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { RoomTypeService } from '../../services/room-type.service';
import { ServiceService } from '../../services/service.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import {
  createReservationForm,
  ReservationFieldsComponent,
} from './components/reservation-fields/reservation-fields.component';

/** Coordina la edición y su vista previa. Los campos y sus reglas se definen en ReservationFieldsComponent. */
@Component({
  selector: 'app-reservation-form',
  imports: [
    SkeletonComponent,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    HeaderComponent,
    ButtonComponent,
    ReservationContentComponent,
    ReservationFieldsComponent,
    TranslocoPipe,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
})
export class ReservationFormComponent {
  private readonly saveSubject = new Subject<void>();
  private readonly reservations = inject(ReservationService);
  private readonly clients = inject(ClientService);
  private readonly types = inject(RoomTypeService);
  private readonly hotelServices = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  detail: ReservationDetails | undefined;
  client: ClientDetailDTO | undefined;
  roomTypes: RoomTypeListDTO[] = [];
  services: ServiceListDTO[] = [];
  originalServiceIds: number[] = [];
  // Las reglas consultan la llegada guardada y la capacidad de cada tipo cuando ya se cargaron.
  // Va después de roomTypes: los validadores se ejecutan al crear el formulario.
  readonly form = createReservationForm({
    originalCheckIn: () => this.detail?.reservation.checkInDate,
    originalStatus: () => this.detail?.reservation.status,
    balance: () => this.previewTotal - (this.detail?.paidTotal ?? 0),
    capacity: (roomTypeId) =>
      this.roomTypes.find((type) => type.roomTypeId === roomTypeId)
        ?.maxCapacity,
  });
  loading = true;
  saving = false;
  submitted = false;
  error = '';
  get base(): string {
    return basePath(this.route);
  }
  get staffViewTitleKey(): string {
    if (!this.staff) return '';
    return this.route.snapshot.paramMap.has('adminId')
      ? 'reservations.detail.adminView'
      : 'reservations.detail.operatorView';
  }
  get staff(): boolean {
    return this.route.snapshot.paramMap.has('adminId') || this.route.snapshot.paramMap.has('operatorId');
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  get servicesOnly(): boolean {
    return !this.staff && this.detail?.reservation.status === 'CHECKED_IN';
  }
  get detailUrl(): string {
    const id = this.detail?.reservation.reservationId;
    return this.staff ? `${this.base}/reservations/${id}` : `/reservation/${id}`;
  }
  get backUrl(): string {
    return this.staff ? `${this.base}/reservations` : '/profile';
  }
  get refundPreview(): number {
    // Redondear a centavos evita mostrar residuos de las operaciones decimales de JavaScript.
    return Math.max(0, Math.round(((this.detail?.paidTotal ?? 0) - this.previewTotal) * 100) / 100);
  }
  // La vista previa conserva cargos contratados y solo toma el precio actual de los servicios nuevos.
  get previewTotal(): number {
    const detail = this.detail;
    if (!detail) return 0;
    const draft = this.form.getRawValue();
    const nights = Math.max(
      0,
      (Date.parse(draft.checkOut) - Date.parse(draft.checkIn)) / 86400000,
    );
    let rate = detail.nightlyPrice;
    if (draft.roomTypeId !== detail.reservation.roomTypeId) {
      const selectedType = this.roomTypes.find((type) => type.roomTypeId === draft.roomTypeId);
      rate = selectedType?.nightlyPrice ?? 0;
    }
    let charges = 0;
    for (const charge of detail.charges) {
      if (charge.serviceId === undefined || draft.serviceIds.includes(charge.serviceId)) {
        charges += charge.subtotal;
      }
    }
    let additions = 0;
    for (const service of this.services) {
      const selected = draft.serviceIds.includes(service.serviceId);
      const alreadyCharged = this.originalServiceIds.includes(service.serviceId);
      if (selected && !alreadyCharged) additions += service.price;
    }
    return (Number.isFinite(nights) ? nights : 0) * rate + charges + additions;
  }
  constructor() {
    // exhaustMap ignora nuevos envíos mientras termina el guardado actual.
    this.saveSubject.pipe(
      exhaustMap(() => this.saveChanges()),
      takeUntilDestroyed(),
    ).subscribe();

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap(([params]) => {
          this.loading = true;
          this.error = '';
          this.detail = undefined;
          this.client = undefined;
          this.submitted = false;
          if (!this.staff && this.authParams.auth === undefined) {
            void this.router.navigate(['/login']);
            return EMPTY;
          }
          const id = Number(params.get('id'));
          // Una id inválida muestra la pantalla 400. Si la reserva no carga, la que corresponda.
          if (!Number.isSafeInteger(id) || id < 1) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          // forkJoin espera que terminen todas estas consultas y entrega sus resultados juntos.
          return forkJoin({
            detail: this.reservations.details(id),
            roomTypes: this.types.getAll(),
            services: this.hotelServices.getAll(),
          }).pipe(
            switchMap((data) => {
              const clientId = data.detail.clientId;
              if (clientId === undefined) return of({ ...data, client: undefined });
              // La ficha es secundaria. Su ausencia no bloquea la edición de la reserva.
              return this.clients.getById(clientId).pipe(
                map((client) => ({ ...data, client })),
                catchError(() => of({ ...data, client: undefined })),
              );
            }),
            catchErrorPage(this.router, this.route),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        if (!this.staff && data.detail.clientId !== this.authParams.auth) {
          showErrorPage(this.router, this.route, 404);
          return;
        }
        if (!this.staff && !canModifyReservation(data.detail)) {
          void this.router.navigate(['/reservation', data.detail.reservation.reservationId], {
            queryParams: this.authParams,
          });
          return;
        }
        this.loading = false;
        this.detail = data.detail;
        this.client = data.client;
        this.roomTypes = data.roomTypes;
        this.services = data.services;
        this.originalServiceIds = [];
        for (const charge of data.detail.charges) {
          if (charge.serviceId !== undefined) this.originalServiceIds.push(charge.serviceId);
        }
        const item = data.detail.reservation;
        this.form.enable({ emitEvent: false });
        this.form.reset({
          checkIn: item.checkInDate,
          checkOut: item.checkOutDate,
          guests: item.guestCount,
          roomTypeId: item.roomTypeId ?? 0,
          status: item.status,
          serviceIds: this.originalServiceIds,
        });
        if (this.servicesOnly) {
          for (const name of ['checkIn', 'checkOut', 'guests', 'roomTypeId', 'status'] as const) {
            this.form.controls[name].disable({ emitEvent: false });
          }
        }
      });
  }
  save(): void {
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    if (this.saving || this.loading || !this.detail) return EMPTY;
    const clientId = this.authParams.auth;
    if (!this.staff && clientId === undefined) return EMPTY;
    this.submitted = true;
    this.error = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    // El orden de las fechas, las 90 noches y la capacidad ya los revisan los validadores del formulario.
    if (this.form.invalid) return EMPTY;
    const draft = this.form.getRawValue();
    const id = this.detail.reservation.reservationId;
    const destination = this.detailUrl;
    const queryParams = { ...this.authParams, saved: true };
    this.saving = true;
    const request = !this.staff && clientId !== undefined
      ? this.reservations.updateForClient(id, clientId, draft)
      : this.reservations.update(id, draft);
    return request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // finalize restablece el estado de guardado tanto si la petición termina bien como si falla.
        finalize(() => {
          this.saving = false;
        }),
      ).pipe(
        tap(() => {
          if (this.detail?.reservation.reservationId !== id || this.authParams.auth !== clientId) return;
          void this.router.navigate([destination], { queryParams });
        }),
        catchError((error: HttpErrorResponse) => {
          this.error = showApiErrors(this.form, error, {
            checkInDate: 'checkIn',
            checkOutDate: 'checkOut',
            guestCount: 'guests',
            roomType: 'roomTypeId',
            services: 'serviceIds',
          });

          return EMPTY;
        }),
      );
  }
}
