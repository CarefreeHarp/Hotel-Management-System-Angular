import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage } from '../../utils/error-page';

type MovementFilter = 'all' | 'payment' | 'refund';

interface MoneyMovement {
  key: string;
  kind: 'payment' | 'refund';
  id: number;
  reservationId: number;
  reservationCode: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  operatorName: string;
  reason?: string;
}

/** Reúne los movimientos de todas las reservas del cliente en un solo historial. */
@Component({
  selector: 'app-client-payment-history',
  imports: [
    ButtonComponent,
    CurrencyPipe,
    DatePipe,
    HeaderComponent,
    PageHeadingComponent,
    RouterLink,
    SkeletonComponent,
  ],
  templateUrl: './client-payment-history.component.html',
  styleUrl: './client-payment-history.component.scss',
})
export class ClientPaymentHistoryComponent implements OnInit {
  private readonly clients = inject(ClientService);
  private readonly reservations = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  client: ClientDetailDTO | undefined;
  movements: MoneyMovement[] = [];
  selectedFilter: MovementFilter = 'all';
  isLoading = true;
  totalPaid = 0;
  totalRefunded = 0;

  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  get netPaid(): number {
    return this.totalPaid - this.totalRefunded;
  }

  get filteredMovements(): MoneyMovement[] {
    return this.selectedFilter === 'all'
      ? this.movements
      : this.movements.filter((movement) => movement.kind === this.selectedFilter);
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      // Si cambia el cliente en la URL, se descarta la lectura anterior.
      switchMap(() => {
        const clientId = this.authParams.auth;
        this.client = undefined;
        this.movements = [];
        this.isLoading = true;
        if (clientId === undefined) {
          void this.router.navigate(['/login'], { replaceUrl: true });
          return of(undefined);
        }
        return forkJoin({
          client: this.clients.getById(clientId),
          history: this.reservations.history(clientId),
        }).pipe(catchErrorPage(this.router, this.route));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((data) => {
      this.client = data?.client;
      this.buildHistory(data?.history ?? []);
      this.isLoading = false;
    });
  }

  reasonLabel(reason: string): string {
    if (reason === 'MODIFICATION') return 'Reservation change';
    if (reason === 'CANCELLATION') return 'Cancellation';
    return reason.replaceAll('_', ' ').toLowerCase();
  }

  private buildHistory(history: ReservationDetails[]): void {
    const movements: MoneyMovement[] = [];
    let paidCents = 0;
    let refundedCents = 0;

    for (const detail of history) {
      const reservationId = detail.reservation.reservationId;
      const reservationCode = detail.reservation.reservationCode;
      for (const payment of detail.payments) {
        movements.push({
          key: `payment-${payment.paymentId}`,
          kind: 'payment',
          id: payment.paymentId,
          reservationId,
          reservationCode,
          amount: payment.amount,
          date: payment.paidAt,
          method: payment.paymentMethod,
          status: payment.status,
          operatorName: payment.operatorName,
        });
        if (payment.status === 'APPROVED') paidCents += Math.round(payment.amount * 100);
      }
      for (const refund of detail.refunds) {
        movements.push({
          key: `refund-${refund.refundId}`,
          kind: 'refund',
          id: refund.refundId,
          reservationId,
          reservationCode,
          amount: refund.amount,
          date: refund.refundedAt,
          method: refund.refundMethod,
          status: refund.status,
          operatorName: refund.operatorName,
          reason: refund.reason,
        });
        if (refund.status === 'APPROVED') refundedCents += Math.round(refund.amount * 100);
      }
    }

    // Las fechas del backend son ISO locales; ordenarlas como texto deja primero la más reciente.
    this.movements = movements.sort((first, second) =>
      second.date.localeCompare(first.date) || second.id - first.id,
    );
    // Se suman centavos para evitar pequeñas diferencias al sumar decimales de JavaScript.
    this.totalPaid = paidCents / 100;
    this.totalRefunded = refundedCents / 100;
  }
}
