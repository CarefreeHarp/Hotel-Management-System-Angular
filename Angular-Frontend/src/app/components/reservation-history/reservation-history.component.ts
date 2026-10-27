import { Component, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { ReservationDetails } from '../../models/booking';
import { ReservationStatus } from '../../models/enums/reservation-status';
import { ButtonComponent } from '../button/button.component';
import { ReservationCardComponent } from '../reservation-card/reservation-card.component';

/** Comparte las tarjetas y filtros del historial entre cliente y personal. */
@Component({
  selector: 'app-reservation-history',
  imports: [ButtonComponent, ReservationCardComponent, TranslocoPipe],
  templateUrl: './reservation-history.component.html',
  styleUrl: './reservation-history.component.scss',
})
export class ReservationHistoryComponent {
  @Input({ required: true }) reservations: ReservationDetails[] = [];
  @Input() staff = false;
  @Input() guestName = '';
  private readonly cancellationRequestedSubject = new Subject<number>();
  @Output() readonly cancellationRequested = this.cancellationRequestedSubject.asObservable();

  requestCancellation(id: number): void {
    if (!this.staff) this.cancellationRequestedSubject.next(id);
  }

  selectedFilter: 'all' | ReservationStatus = 'all';
  // labelKey es la clave de traducción de cada filtro.
  private readonly clientFilters: {
    labelKey: string;
    status: 'all' | ReservationStatus;
  }[] = [
    { labelKey: 'reservationHistory.filters.all', status: 'all' },
    { labelKey: 'reservationHistory.filters.upcoming', status: ReservationStatus.CONFIRMED },
    { labelKey: 'reservationHistory.filters.inProgress', status: ReservationStatus.CHECKED_IN },
    { labelKey: 'reservationHistory.filters.awaitingReview', status: ReservationStatus.CHECKED_OUT },
    { labelKey: 'reservationHistory.filters.awaitingPayment', status: ReservationStatus.PENDING },
    { labelKey: 'reservationHistory.filters.cancelled', status: ReservationStatus.CANCELLED },
  ];
  // Cliente y personal comparten las reservas. Cambian únicamente las etiquetas de sus filtros.
  get filters(): { labelKey: string; status: 'all' | ReservationStatus }[] {
    return this.staff
      ? [
          { labelKey: 'reservationHistory.filters.all', status: 'all' },
          ...Object.values(ReservationStatus).map((status) => ({
            labelKey: `enums.reservationStatus.${status}`,
            status,
          })),
        ]
      : this.clientFilters;
  }
  get filteredReservations(): ReservationDetails[] {
    return this.selectedFilter === 'all'
      ? this.reservations
      : this.reservations.filter(
          (detail) => detail.reservation.status === this.selectedFilter,
        );
  }
}
