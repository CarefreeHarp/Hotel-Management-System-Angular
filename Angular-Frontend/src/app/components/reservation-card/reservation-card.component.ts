import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { canModifyReservation, ReservationDetails } from '../../models/booking';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-reservation-card',
  imports: [CurrencyPipe, DatePipe, OptimizedImageDirective, ButtonComponent, TranslocoPipe],
  templateUrl: './reservation-card.component.html',
  styleUrl: './reservation-card.component.scss',
})
export class ReservationCardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  @Input({ required: true }) detail: ReservationDetails | undefined;
  @Input({ required: true }) guestName: string = '';
  @Input() staff = false;
  private readonly cancellationRequestedSubject = new Subject<number>();
  @Output() readonly cancellationRequested = this.cancellationRequestedSubject.asObservable();

  /** Solicita confirmación al perfil. La tarjeta no modifica ni elimina la reserva. */
  requestCancellation(): void {
    if (this.staff || !this.detail || this.detail.reservation.status === 'CANCELLED') {
      return;
    }
    this.cancellationRequestedSubject.next(this.detail.reservation.reservationId);
  }

  readonly stars = [1, 2, 3, 4, 5];
  selectedRating = 0;
  get canModify(): boolean {
    return !this.staff && !!this.detail && canModifyReservation(this.detail);
  }
  modify(): void {
    if (!this.detail || !this.canModify) return;
    void this.router.navigate(['/reservation', this.detail.reservation.reservationId, 'edit'], {
      queryParams: this.authParams,
    });
  }
  openDetails(event?: MouseEvent): void {
    if (!this.detail) return;
    if (event?.target instanceof Element && event.target.closest('button, a'))
      return;
    void this.router.navigate(
      this.staff
        ? [
            basePath(this.route),
            'reservations',
            this.detail.reservation.reservationId,
          ]
        : ['/reservation', this.detail.reservation.reservationId],
      {
        queryParams: this.staff
          ? { clientId: this.detail.clientId }
          : this.authParams,
      },
    );
  }
  get otherGuests(): number {
    return Math.max(0, (this.detail?.reservation.guestCount ?? 1) - 1);
  }
  get services(): string {
    return (
      this.detail?.charges.map((charge) => charge.concept).join(', ') ?? ''
    );
  }
  get servicesPreview(): string {
    return this.services.length > 50
      ? this.services.slice(0, 50) + '...'
      : this.services;
  }
  // El texto se arma en TS: translate usa el idioma con el que arrancó la página.
  get countdown(): string {
    const reservation = this.detail?.reservation;
    if (!reservation) return '';
    const t = (key: string, days = 0) => translate(`reservationCard.countdown.${key}`, { days });
    if (reservation.status === 'CHECKED_IN') return t('inProgress');
    if (reservation.status === 'PENDING') return t('awaitingPayment');
    if (reservation.status === 'CANCELLED') return t('cancelled');
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (reservation.status === 'CHECKED_OUT') {
      const days = Math.max(
        0,
        Math.round((today - Date.parse(reservation.checkOutDate)) / 86400000),
      );
      if (days === 0) return t('checkOutToday');
      return t(days === 1 ? 'checkOutAgoOne' : 'checkOutAgoMany', days);
    }
    const days = Math.round(
      (Date.parse(reservation.checkInDate) - today) / 86400000,
    );
    if (days > 0) return t(days === 1 ? 'inOne' : 'inMany', days);
    if (days === 0) return t('checkInToday');
    return t(days === -1 ? 'checkInAgoOne' : 'checkInAgoMany', Math.abs(days));
  }
}
