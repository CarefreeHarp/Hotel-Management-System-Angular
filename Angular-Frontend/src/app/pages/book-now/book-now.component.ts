import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ParamMap,
  Params,
  Router,
  RouterLink,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  catchError, EMPTY, exhaustMap, forkJoin,
  map, Observable, of, Subject, switchMap, tap
} from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import {
  BookingDraft,
  BookingQuote,
  BookingStay,
  BookingStep,
  CardPayment,
  RoomTypeAvailability,
  validStay,
} from '../../models/booking';
import { ServiceCatalogDTO } from '../../models/dto/service-catalog-dto';
import { ReservationService } from '../../services/reservation.service';
import { ServiceService } from '../../services/service.service';
import { apiErrorMessage, apiFieldErrors } from '../../utils/api-error';
import { clientQuery } from '../../utils/client-query';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { BookingCheckoutComponent } from './components/booking-checkout/booking-checkout.component';
import { BookingDatesComponent } from './components/booking-dates/booking-dates.component';
import { BookingPaymentComponent } from './components/booking-payment/booking-payment.component';
import { BookingRoomTypesComponent } from './components/booking-room-types/booking-room-types.component';
import { BookingServicesComponent } from './components/booking-services/booking-services.component';
/** Coordina los pasos desde la URL. Cada componente hijo presenta y emite los datos de su paso. */
@Component({
  selector: 'app-book-now',
  imports: [
    NgTemplateOutlet,
    SkeletonComponent,
    HeaderComponent,
    RouterLink,
    BookingDatesComponent,
    BookingRoomTypesComponent,
    BookingServicesComponent,
    BookingCheckoutComponent,
    BookingPaymentComponent,
    TranslocoPipe,
  ],
  templateUrl: './book-now.component.html',
  styleUrl: './book-now.component.scss',
})
export class BookNowComponent {

  private readonly confirmSubject = new Subject<CardPayment | undefined>();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservations = inject(ReservationService);
  private readonly services = inject(ServiceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly steps: BookingStep[] = [
    'dates',
    'room-types',
    'services',
    'checkout',
    'payment',
  ];
  step: BookingStep = 'dates';
  stay: BookingStay = { checkIn: '', checkOut: '', guests: 1 };
  draft: BookingDraft | undefined;
  types: RoomTypeAvailability[] = [];
  catalog: ServiceCatalogDTO[] = [];
  quote: BookingQuote | undefined;
  loading = false;
  busy = false;
  error = '';
  // Errores de la tarjeta que devuelve el backend, por campo del formulario de pago.
  paymentErrors: Record<string, string> = {};
  private pendingError = '';
  clientId: number | undefined;
  readonly profileUrl = '/profile';

  constructor() {
    // exhaustMap mantiene un solo guardado activo sin cancelar una reserva por otro clic.
    this.confirmSubject.pipe(
      exhaustMap((payment) => this.createReservation(payment)),
      takeUntilDestroyed(),
    ).subscribe();
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        // Solo la lectura del paso se cancela al navegar. Guardar una reserva es una operación aparte.
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap((params) => this.loadBookingStep(params)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => (this.loading = false));
  }
  /** Reconstruye el borrador desde la URL y corrige los pasos que aún no tienen sus datos previos. */
  private loadBookingStep(params: ParamMap): Observable<null> {
    this.clientId = clientQuery(this.route).auth;
    if (this.clientId === undefined) {
      void this.router.navigate(['/login'], { replaceUrl: true });
      return of(null);
    }
    const step = params.get('step');
    this.step = this.isStep(step) ? step : 'dates';
    this.error = this.pendingError;
    this.pendingError = '';
    this.paymentErrors = {};
    this.types = [];
    this.quote = undefined;
    this.stay = {
      checkIn: params.get('check-in') ?? '',
      checkOut: params.get('check-out') ?? '',
      guests: Number(params.get('guests') ?? 1),
    };
    const roomTypeId = Number(params.get('room-type'));
    const rawIds = params.getAll('service-ids');
    const serviceIds = rawIds
      .map(Number)
      .filter((value) => Number.isSafeInteger(value) && value > 0);
    this.draft = { ...this.stay, roomTypeId, serviceIds };
    if (!step || !this.isStep(step)) {
      void this.go('dates', {}, true);
      return of(null);
    }
    if (this.step !== 'dates' && !validStay(this.stay)) {
      void this.go('dates', {}, true);
      return of(null);
    }
    if (
      ['services', 'checkout', 'payment'].includes(this.step) &&
      (!Number.isSafeInteger(roomTypeId) || roomTypeId < 1)
    ) {
      void this.go('room-types', {}, true);
      return of(null);
    }
    if (this.step === 'dates') {
      this.loading = false;
      return of(null);
    }
    return this.loadStepData(this.draft);
  }

  /** Carga únicamente los datos del paso actual. La tarjeta nunca forma parte del borrador. */
  private loadStepData(draft: BookingDraft): Observable<null> {
    this.loading = true;
    if (this.step === 'room-types')
      return this.reservations.available(this.stay).pipe(
        map((types) => {
          this.types = types;
          return null;
        }),
        catchError((error) => this.failed(error)),
      );
    // forkJoin espera que terminen todas estas consultas y entrega sus resultados juntos.
    return forkJoin({
      quote: this.reservations.quote(draft),
      catalog: this.services.getCatalog(),
    }).pipe(
      map((data) => {
        this.quote = data.quote;
        this.catalog = data.catalog;
        return null;
      }),
      catchError((error) => this.failed(error)),
    );
  }

  // Si el servidor falla o no responde, el paso no puede mostrarse: pantalla de error.
  // Los 4xx son reglas de la reserva (fechas, capacidad, disponibilidad) y su motivo
  // se muestra aquí, junto a los botones para cambiar las fechas o volver al paso anterior.
  private failed(error: HttpErrorResponse): Observable<null> {
    const code = errorPageCode(error);
    if (code >= 500) {
      showErrorPage(this.router, this.route, code);
      return EMPTY;
    }
    this.error = this.bookingError(error);
    return of(null);
  }

  private bookingError(error: HttpErrorResponse): string {
    return apiErrorMessage(error, 'booking.error');
  }

  private isStep(value: string | null): value is BookingStep {
    return (
      value === 'dates' ||
      value === 'room-types' ||
      value === 'services' ||
      value === 'checkout' ||
      value === 'payment'
    );
  }

  go(
    step: BookingStep,
    queryParams: Params = {},
    replaceUrl = false,
  ): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...queryParams, step },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
  // Cambiar las fechas invalida el tipo y los servicios de los pasos posteriores.
  chooseDates(stay: BookingStay): void {
    void this.go('room-types', {
      'check-in': stay.checkIn,
      'check-out': stay.checkOut,
      guests: stay.guests,
      'room-type': null,
      'service-ids': null,
    });
  }

  chooseType(id: number): void {
    void this.go('services', { 'room-type': id, 'service-ids': null });
  }

  chooseServices(ids: number[]): void {
    void this.go('checkout', { 'service-ids': ids.length ? ids : null });
  }

  back(): void {
    const index = this.steps.indexOf(this.step);
    const previous = this.steps[index - 1];
    if (previous) void this.go(previous);
  }
  // El pago se envía en el cuerpo de la petición. La URL solo conserva el contexto del cliente.
  confirm(payment?: CardPayment): void {
    this.confirmSubject.next(payment);
  }

  private createReservation(payment?: CardPayment): Observable<unknown> {
    if (!this.draft || !this.quote || this.busy || this.clientId === undefined)
      return EMPTY;
    this.busy = true;
    this.error = '';
    this.paymentErrors = {};
    return this.reservations
      .create(this.clientId, this.draft, payment)
      .pipe(
        tap((detail) => {
          this.busy = false;
          void this.router.navigate(['/profile'], {
            queryParams: { auth: detail.clientId },
            replaceUrl: true,
          });
        }),
        catchError((error: HttpErrorResponse) => {
          this.busy = false;
          this.showPaymentErrors(error);
          if (error.status === 409) {
            this.pendingError = this.error;
            void this.go('room-types', {
              'room-type': null,
              'service-ids': null,
            });
          }

          return EMPTY;
        }),
      );
  }

  /** Separa los errores de tarjeta de los mensajes generales de la reserva. */
  private showPaymentErrors(error: HttpErrorResponse): void {
    const payment: Record<string, string> = {};
    const others: string[] = [];
    for (const [field, message] of Object.entries(apiFieldErrors(error))) {
      if (field.startsWith('initialPayment.'))
        payment[field.slice('initialPayment.'.length)] = message;
      else others.push(message);
    }
    this.paymentErrors = payment;
    this.error = Object.keys(payment).length
      ? others.join(' ')
      : this.bookingError(error);
  }

}
