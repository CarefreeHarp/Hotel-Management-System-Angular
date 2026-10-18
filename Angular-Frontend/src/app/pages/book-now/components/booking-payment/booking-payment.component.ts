import { BookingReservationSummaryComponent } from '../booking-reservation-summary/booking-reservation-summary.component';
import { Component, Input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { BookingQuote, CardPayment } from '../../../../models/booking';
@Component({
  selector: 'app-booking-payment',
  imports: [BookingReservationSummaryComponent, FormsModule, CurrencyPipe],
  templateUrl: './booking-payment.component.html',
  styleUrl: './booking-payment.component.scss',
})
export class BookingPaymentComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
  @Input() busy = false;
  readonly pay = output<CardPayment>();
  readonly payLater = output<void>();
  amount = 0;
  cardholderName = '';
  cardNumber = '';
  expiryDate = '';
  securityCode = '';
  submitted = false;
  ngOnInit(): void {
    this.amount = this.quote?.total ?? 0;
  }
  get validationMessage(): string {
    if (
      !Number.isFinite(this.amount) ||
      this.amount < 100000 ||
      this.amount > (this.quote?.total ?? 0)
    )
      return 'Enter at least COP 100,000 without exceeding the total.';
    const month = Number(this.expiryDate.split('/')[0]);
    if (!Number.isInteger(month) || month < 1 || month > 12)
      return 'Enter an expiry month from 1 to 12.';
    return '';
  }
  valid(): boolean {
    return !this.validationMessage;
  }
  formatCardNumber(control: HTMLInputElement): void {
    this.format(control, 'card');
  }
  formatExpiry(control: HTMLInputElement): void {
    this.format(control, 'expiry');
  }
  eraseSeparator(
    event: Event,
    control: HTMLInputElement,
    kind: 'card' | 'expiry',
  ): void {
    const position = control.selectionStart;
    if (
      position === null ||
      position !== control.selectionEnd ||
      position < 2 ||
      /[0-9]/.test(control.value.charAt(position - 1))
    )
      return;
    event.preventDefault();
    control.value =
      control.value.slice(0, position - 2) + control.value.slice(position);
    control.setSelectionRange(position - 2, position - 2);
    this.format(control, kind);
  }
  private format(control: HTMLInputElement, kind: 'card' | 'expiry'): void {
    const digitsBefore = control.value
      .slice(0, control.selectionStart ?? control.value.length)
      .replace(/\D/g, '').length;
    const rawDigits = control.value.replace(/\D/g, '');
    const digits = kind === 'expiry' ? rawDigits.slice(0, 4) : rawDigits;
    const formatted =
      kind === 'card'
        ? (digits.match(/.{1,4}/g)?.join(' ') ?? '')
        : digits.length >= 2
          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
          : digits;
    if (kind === 'card') this.cardNumber = formatted;
    else this.expiryDate = formatted;
    control.value = formatted;
    let position = 0;
    let count = 0;
    while (position < formatted.length && count < digitsBefore) {
      if (/[0-9]/.test(formatted.charAt(position))) count++;
      position++;
    }
    while (
      position < formatted.length &&
      !/[0-9]/.test(formatted.charAt(position))
    )
      position++;
    control.setSelectionRange(position, position);
  }
  submit(): void {
    this.submitted = true;
    if (this.quote && this.valid() && !this.busy)
      this.pay.emit({
        amount: this.amount,
        cardholderName: this.cardholderName.trim(),
        cardNumber: this.cardNumber.replace(/ /g, ''),
        expiryDate: this.expiryDate,
        securityCode: this.securityCode,
      });
  }
}
