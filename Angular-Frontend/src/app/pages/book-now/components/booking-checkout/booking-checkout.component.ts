import { CurrencyPipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { BookingQuote } from '../../../../models/booking';
@Component({
  selector: 'app-booking-checkout',
  imports: [CurrencyPipe, TranslocoPipe],
  templateUrl: './booking-checkout.component.html',
  styleUrl: './booking-checkout.component.scss',
})
export class BookingCheckoutComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
  @Input() busy = false;
  protected readonly payLaterSubject = new Subject<void>();
  @Output('payLater') readonly payLater$ = this.payLaterSubject.asObservable();
  protected readonly payNowSubject = new Subject<void>();
  @Output('payNow') readonly payNow$ = this.payNowSubject.asObservable();
}
