import { CurrencyPipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
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
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly payLaterSubject = new Subject<void>();
  @Output('payLater') readonly payLater$ = this.payLaterSubject.asObservable();
  protected readonly payNowSubject = new Subject<void>();
  @Output('payNow') readonly payNow$ = this.payNowSubject.asObservable();
}
