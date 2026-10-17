import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { BookingQuote, CardPayment } from '../../../../models/booking';
@Component({ selector: 'app-booking-payment', imports: [FormsModule, CurrencyPipe], templateUrl: './booking-payment.component.html', styleUrl: './booking-payment.component.scss' })
export class BookingPaymentComponent {
    readonly quote = input.required<BookingQuote>();
    readonly busy = input(false);
    readonly pay = output<CardPayment>();
    readonly payLater = output<void>();
    amount = 0;
    cardholderName = '';
    cardNumber = '';
    expiryDate = '';
    securityCode = '';
    ngOnInit(): void { this.amount = this.quote().total; }
    valid(): boolean { return Number.isFinite(this.amount) && this.amount > 0 && this.amount <= this.quote().total && !!this.cardholderName.trim() && /^[0-9]{16}$/.test(this.cardNumber.replace(/ /g, '')) && /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(this.expiryDate) && /^[0-9]{3}$/.test(this.securityCode); }
    submit(): void { if (this.valid() && !this.busy())
        this.pay.emit({ amount: this.amount, cardholderName: this.cardholderName, cardNumber: this.cardNumber, expiryDate: this.expiryDate, securityCode: this.securityCode }); }
}
