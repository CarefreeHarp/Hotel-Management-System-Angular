import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReservationDetails } from '../../models/booking';
@Component({
  selector: 'app-reservation-finance',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './reservation-finance.component.html',
  styleUrl: './reservation-finance.component.scss',
})
export class ReservationFinanceComponent {
  @Input({ required: true }) detail: ReservationDetails | undefined;
}
