import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CLIENT_SELF_SERVICE, ReservationDetails } from '../../models/booking';
@Component({
  selector: 'app-reservation-finance',
  imports: [CurrencyPipe, DatePipe, TranslocoPipe],
  templateUrl: './reservation-finance.component.html',
  styleUrl: './reservation-finance.component.scss',
})
export class ReservationFinanceComponent {
  @Input({ required: true }) detail: ReservationDetails | undefined;
  readonly selfService = CLIENT_SELF_SERVICE;
}
