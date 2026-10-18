import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReservationDetails } from '../../../../models/booking';
@Component({
  selector: 'app-reservation-finance',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './reservation-finance.component.html',
  styleUrl: './reservation-finance.component.scss',
})
export class ReservationFinanceComponent {
  readonly detail = input.required<ReservationDetails>();
}
