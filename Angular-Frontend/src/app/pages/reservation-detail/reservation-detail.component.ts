import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { catchError, combineLatest, EMPTY, exhaustMap, finalize, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ReservationContentComponent } from '../../components/reservation-content/reservation-content.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { canModifyReservation, canPayReservation, CardPayment, MAX_PAYMENT, MIN_PAYMENT, ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { apiErrorMessage, apiFieldErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { hasMaxDecimals } from '../../utils/form-validators';
import { BookingPaymentComponent } from '../book-now/components/booking-payment/booking-payment.component';

/** Carga reserva y huésped. El componente de finanzas presenta los cargos y pagos recibidos. */
@Component({
  selector: 'app-reservation-detail',
  imports: [
    SkeletonComponent,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    ButtonComponent,
    ReservationContentComponent,
    BookingPaymentComponent,
    CurrencyPipe,
    FormsModule,
    TranslocoPipe,
  ],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.scss',
})
export class ReservationDetailComponent implements OnInit {
  private readonly paymentSubject = new Subject<CardPayment>();
  private readonly cashPaymentSubject = new Subject<number>();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservations = inject(ReservationService);
  private readonly clients = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);
  detail: ReservationDetails | undefined;
  client: ClientDetailDTO | undefined;
  isLoading = true;
  showPayment = false;
  paying = false;
  paymentSaved = false;
  paymentError = '';
  paymentErrors: Record<string, string> = {};
  showCashPayment = false;
  cashAmount: number | null = null;
  cashSubmitted = false;
  cashAmountError = '';
  readonly minPayment = MIN_PAYMENT;
  get operatorId(): number | undefined {
    const id = Number(this.route.snapshot.paramMap.get('operatorId'));
    return Number.isSafeInteger(id) && id > 0 ? id : undefined;
  }
  get canTakeCash(): boolean {
    return this.operatorId !== undefined && !!this.detail && canPayReservation(this.detail);
  }
  get minimumCashPayment(): number {
    return Math.min(MIN_PAYMENT, this.detail?.balance ?? 0);
  }
  get cashErrorForAmount(): string {
    if (this.cashAmountError) {
      return this.cashAmountError;
    }
    if (!this.cashSubmitted) {
      return '';
    }
    const amount = this.cashAmount;
    if (amount === null || !Number.isFinite(amount)) {
      return translate('reservations.cash.required');
    }
    if (!hasMaxDecimals(amount, 2)) {
      return translate('validation.payment.amount.decimals');
    }
    if (amount < this.minimumCashPayment || amount > (this.detail?.balance ?? 0)) {
      return translate('reservations.cash.range');
    }
    if (amount > MAX_PAYMENT) {
      return translate('validation.payment.amount.max');
    }
    return '';
  }
  get ownsReservation(): boolean {
    return !this.staff && this.authParams.auth !== undefined && this.detail?.clientId === this.authParams.auth;
  }
  get canModify(): boolean {
    return this.ownsReservation && !!this.detail && canModifyReservation(this.detail);
  }
  get canPay(): boolean {
    return this.ownsReservation && !!this.detail && canPayReservation(this.detail);
  }
  get saved(): boolean {
    return this.route.snapshot.queryParamMap.get('saved') === 'true';
  }
  get staff(): boolean {
    return (
      this.route.snapshot.paramMap.has('adminId') ||
      this.route.snapshot.paramMap.has('operatorId')
    );
  }
  get staffViewTitleKey(): string {
    if (this.route.snapshot.paramMap.has('adminId')) {
      return 'reservations.detail.adminView';
    }
    if (this.route.snapshot.paramMap.has('operatorId')) {
      return 'reservations.detail.operatorView';
    }
    return '';
  }
  get clientHistoryId(): number | undefined {
    const id = Number(this.route.snapshot.queryParamMap.get('clientId'));
    return this.staff && Number.isSafeInteger(id) && id > 0 ? id : undefined;
  }
  // El tablero del operario abre el detalle con ?from=front-desk para cobrar y volver.
  get fromFrontDesk(): boolean {
    return this.staff && this.route.snapshot.queryParamMap.get('from') === 'front-desk';
  }
  get backUrl(): string {
    if (this.clientHistoryId !== undefined) {
      return `${basePath(this.route)}/clients/${this.clientHistoryId}`;
    }
    if (this.fromFrontDesk) {
      return basePath(this.route);
    }
    return this.staff ? `${basePath(this.route)}/reservations` : '/profile';
  }
  get backLabelKey(): string {
    if (this.clientHistoryId !== undefined) {
      return 'reservations.detail.backToClient';
    }
    if (this.fromFrontDesk) {
      return 'reservations.detail.backToFrontDesk';
    }
    return this.staff ? 'reservations.detail.backToReservations' : 'reservations.detail.backToMyReservations';
  }
  get editUrl(): string {
    if (!this.staff) {
      return `/reservation/${this.detail?.reservation.reservationId}/edit`;
    }
    return `${basePath(this.route)}/reservations/${this.detail?.reservation.reservationId}/edit`;
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  ngOnInit(): void {
    // exhaustMap evita dos cobros simultáneos por clics repetidos. Al terminar se muestra el saldo del servidor.
    this.paymentSubject.pipe(
      exhaustMap((payment) => this.performPayment(payment)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
    this.cashPaymentSubject.pipe(
      exhaustMap((amount) => this.performCashPayment(amount)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap(([params]) => {
          this.detail = undefined;
          this.client = undefined;
          this.isLoading = true;
          this.showPayment = false;
          this.showCashPayment = false;
          this.paymentSaved = false;
          this.paymentError = '';
          this.cashAmountError = '';
          const id = Number(params.get('id'));
          // Una id inválida muestra la pantalla 400. Si la reserva no carga, la que corresponda.
          if (!Number.isSafeInteger(id) || id <= 0) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          return this.reservations.details(id).pipe(
            switchMap((detail) => {
              if (detail.clientId === undefined) {
                return of({ detail, client: undefined });
              }
              return this.clients.getById(detail.clientId).pipe(
                map((client) => ({ detail, client })),
                // El huésped es información secundaria. Su ausencia no impide mostrar la reserva.
                catchError(() => of({ detail, client: undefined })),
              );
            }),
            catchErrorPage(this.router, this.route),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.detail = data?.detail;
        this.client = data?.client;
        this.isLoading = false;
      });
  }

  pay(payment: CardPayment): void {
    this.paymentSubject.next(payment);
  }

  togglePayment(): void {
    if (this.paying) {
      return;
    }
    this.paymentError = '';
    this.paymentErrors = {};
    this.showPayment = !this.showPayment;
  }

  toggleCashPayment(): void {
    if (this.paying) {
      return;
    }
    this.showCashPayment = !this.showCashPayment;
    this.cashAmount = this.showCashPayment ? Math.min(this.detail?.balance ?? 0, MAX_PAYMENT) : null;
    this.cashSubmitted = false;
    this.cashAmountError = '';
    this.paymentError = '';
  }

  payCash(): void {
    this.cashSubmitted = true;
    if (!this.canTakeCash || this.paying || this.cashErrorForAmount || this.cashAmount === null) {
      return;
    }
    this.cashPaymentSubject.next(this.cashAmount);
  }

  private performCashPayment(amount: number): Observable<unknown> {
    const operatorId = this.operatorId;
    const id = this.detail?.reservation.reservationId;
    if (!this.canTakeCash || this.paying || operatorId === undefined || id === undefined) {
      return EMPTY;
    }
    this.paying = true;
    this.paymentSaved = false;
    this.paymentError = '';
    this.cashAmountError = '';
    return this.reservations.addCashPayment(id, operatorId, amount).pipe(
      tap((detail) => {
        if (this.operatorId !== operatorId || this.detail?.reservation.reservationId !== id) {
          return;
        }
        this.detail = detail;
        this.showCashPayment = false;
        this.paymentSaved = true;
      }),
      catchError((error: unknown) => {
        if (this.operatorId !== operatorId || this.detail?.reservation.reservationId !== id) {
          return EMPTY;
        }
        this.cashAmountError = apiFieldErrors(error)['amount'] ?? '';
        this.paymentError = this.cashAmountError ? '' : apiErrorMessage(error);
        return EMPTY;
      }),
      finalize(() => { this.paying = false; }),
    );
  }

  private performPayment(payment: CardPayment): Observable<unknown> {
    const clientId = this.authParams.auth;
    const id = this.detail?.reservation.reservationId;
    if (!this.canPay || this.paying || clientId === undefined || id === undefined) {
      return EMPTY;
    }
    this.paying = true;
    this.paymentSaved = false;
    this.paymentError = '';
    this.paymentErrors = {};
    return this.reservations.addPayment(id, clientId, payment).pipe(
      tap((detail) => {
        // Una respuesta tardía no debe sustituir otra reserva o cliente al cambiar la URL.
        if (this.authParams.auth !== clientId || this.detail?.reservation.reservationId !== id) {
          return;
        }
        this.detail = detail;
        this.showPayment = false;
        this.paymentSaved = true;
      }),
      catchError((error: unknown) => {
        if (this.authParams.auth !== clientId || this.detail?.reservation.reservationId !== id) {
          return EMPTY;
        }
        for (const [field, message] of Object.entries(apiFieldErrors(error))) {
          if (field.startsWith('initialPayment.')) {
            this.paymentErrors[field.slice('initialPayment.'.length)] = message;
          }
        }
        this.paymentError = Object.keys(this.paymentErrors).length ? '' : apiErrorMessage(error);
        return EMPTY;
      }),
      // finalize restablece el botón tanto si el servidor aprueba como si rechaza el pago.
      finalize(() => { this.paying = false; }),
    );
  }
}
