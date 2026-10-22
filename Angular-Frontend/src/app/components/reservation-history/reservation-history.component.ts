import { Component, Input } from '@angular/core';
import { ReservationDetails } from '../../models/booking';
import { ReservationStatus } from '../../models/enums/reservation-status';
import { ButtonComponent } from '../button/button.component';
import { ReservationCardComponent } from '../reservation-card/reservation-card.component';

/** Comparte las tarjetas y filtros del historial entre cliente y personal. */
@Component({
  selector: 'app-reservation-history',
  imports: [ButtonComponent, ReservationCardComponent],
  templateUrl: './reservation-history.component.html',
  styleUrl: './reservation-history.component.scss',
})
export class ReservationHistoryComponent {
  @Input({ required: true }) reservations: ReservationDetails[] = [];
  @Input() staff = false;
  @Input() guestName = '';
  selectedFilter: 'all' | ReservationStatus = 'all';
  private readonly clientFilters: {
    label: string;
    status: 'all' | ReservationStatus;
  }[] = [
    { label: 'All', status: 'all' },
    { label: 'Upcoming', status: ReservationStatus.CONFIRMED },
    { label: 'In progress', status: ReservationStatus.CHECKED_IN },
    { label: 'Awaiting review', status: ReservationStatus.CHECKED_OUT },
    { label: 'Awaiting payment', status: ReservationStatus.PENDING },
    { label: 'Cancelled', status: ReservationStatus.CANCELLED },
  ];
  // Cliente y personal comparten las reservas. Cambian únicamente las etiquetas de sus filtros.
  get filters(): { label: string; status: 'all' | ReservationStatus }[] {
    return this.staff
      ? [
          { label: 'All', status: 'all' },
          ...Object.values(ReservationStatus).map((status) => ({
            label: status.replace('_', ' '),
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
