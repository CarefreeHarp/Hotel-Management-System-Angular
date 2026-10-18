import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { BookingQuote } from '../../../../models/booking';
@Component({
  selector: 'app-booking-checkout',
  imports: [CurrencyPipe],
  templateUrl: './booking-checkout.component.html',
  styleUrl: './booking-checkout.component.scss',
})
export class BookingCheckoutComponent {
  readonly quote = input.required<BookingQuote>();
  readonly busy = input(false);
  readonly payLater = output<void>();
  readonly payNow = output<void>();
}
