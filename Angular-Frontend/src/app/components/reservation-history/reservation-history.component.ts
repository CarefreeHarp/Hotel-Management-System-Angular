import { Component, Input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ReservationDetails } from '../../models/booking';
@Component({
  selector: 'app-reservation-history',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './reservation-history.component.html',
  styleUrl: './reservation-history.component.scss',
})
export class ReservationHistoryComponent {
  @Input({ required: true }) reservations: ReservationDetails[] = [];
  @Input() staff = false;
}
