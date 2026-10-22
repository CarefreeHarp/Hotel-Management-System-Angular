import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { BookingQuote } from '../../../../models/booking';
@Component({
  selector: 'app-booking-reservation-summary',
  imports: [CurrencyPipe, DatePipe, OptimizedImageDirective],
  templateUrl: './booking-reservation-summary.component.html',
  styleUrl: './booking-reservation-summary.component.scss',
})
export class BookingReservationSummaryComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
}
