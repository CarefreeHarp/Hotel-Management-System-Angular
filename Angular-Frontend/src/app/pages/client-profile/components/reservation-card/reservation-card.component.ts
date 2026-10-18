import { ActivatedRoute, Router } from '@angular/router';
import { clientQuery } from '../../../../utils/client-query';
import { Component, inject, Input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonComponent } from '../../../../components/button/button.component';
import { ReservationDetails } from '../../../../models/booking';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';

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
  readonly stars = [1, 2, 3, 4, 5];
  selectedRating = 0;
  openDetails(event?: MouseEvent): void {
    if (!this.detail) return;
    if (event?.target instanceof Element && event.target.closest('button, a'))
      return;
    void this.router.navigate(
      ['/reservation', this.detail.reservation.reservationId],
      {
        queryParams: this.authParams,
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
