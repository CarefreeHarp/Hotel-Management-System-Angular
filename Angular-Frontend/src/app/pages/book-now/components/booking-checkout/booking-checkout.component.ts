import { Component, Input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { BookingQuote } from '../../../../models/booking';
@Component({
  selector: 'app-booking-checkout',
  imports: [CurrencyPipe],
  templateUrl: './booking-checkout.component.html',
  styleUrl: './booking-checkout.component.scss',
})
export class BookingCheckoutComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
  @Input() busy = false;
  readonly payLater = output<void>();
  readonly payNow = output<void>();
}
