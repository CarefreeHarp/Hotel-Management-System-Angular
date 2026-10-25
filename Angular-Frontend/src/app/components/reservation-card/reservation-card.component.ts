import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ReservationDetails } from '../../models/booking';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-reservation-card',
  imports: [CurrencyPipe, DatePipe, OptimizedImageDirective, ButtonComponent],
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
  get countdown(): string {
    const reservation = this.detail?.reservation;
    if (!reservation) return '';
    if (reservation.status === 'CHECKED_IN') return 'In progress';
    if (reservation.status === 'PENDING') return 'Awaiting payment';
    if (reservation.status === 'CANCELLED') return 'Cancelled';
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (reservation.status === 'CHECKED_OUT') {
      const days = Math.max(
        0,
        Math.round((today - Date.parse(reservation.checkOutDate)) / 86400000),
      );
      return days === 0
        ? 'Check-out today'
        : `Check-out was ${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    const days = Math.round(
      (Date.parse(reservation.checkInDate) - today) / 86400000,
    );
    if (days > 0) return `In ${days} ${days === 1 ? 'day' : 'days'}`;
    if (days === 0) return 'Check-in today';
    return `Check-in was ${Math.abs(days)} ${days === -1 ? 'day' : 'days'} ago`;
  }
}
