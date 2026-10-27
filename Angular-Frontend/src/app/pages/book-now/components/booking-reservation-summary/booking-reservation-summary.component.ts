import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { BookingQuote } from '../../../../models/booking';
@Component({
  selector: 'app-booking-reservation-summary',
  imports: [CurrencyPipe, DatePipe, OptimizedImageDirective, TranslocoPipe],
  templateUrl: './booking-reservation-summary.component.html',
  styleUrl: './booking-reservation-summary.component.scss',
})
export class BookingReservationSummaryComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
}
