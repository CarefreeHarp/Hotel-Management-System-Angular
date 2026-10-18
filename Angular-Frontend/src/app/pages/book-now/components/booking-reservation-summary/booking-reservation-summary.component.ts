import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BookingQuote } from '../../../../models/booking';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
@Component({
  selector: 'app-booking-reservation-summary',
  imports: [CurrencyPipe, DatePipe, OptimizedImageDirective],
  templateUrl: './booking-reservation-summary.component.html',
  styleUrl: './booking-reservation-summary.component.scss',
})
export class BookingReservationSummaryComponent {
  readonly quote = input.required<BookingQuote>();
}
