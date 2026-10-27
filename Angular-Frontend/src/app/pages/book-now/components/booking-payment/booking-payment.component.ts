import { CurrencyPipe } from '@angular/common';
import { Component, Input, LOCALE_ID, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import {
  BookingQuote,
  CardPayment,
  MAX_PAYMENT,
  MIN_PAYMENT,
} from '../../../../models/booking';
import { PAYMENT_MESSAGES } from '../../../../utils/form-messages';
import { hasMaxDecimals } from '../../../../utils/form-validators';
import { BookingReservationSummaryComponent } from '../booking-reservation-summary/booking-reservation-summary.component';

// Mensajes del backend (texto) o claves de traducción de las reglas locales.
type PaymentErrors = Partial<Record<keyof CardPayment, string>>;

/** Comprueba y emite el pago al padre. Los datos de tarjeta se mantienen fuera de la URL. */
@Component({
  selector: 'app-booking-payment',
  imports: [BookingReservationSummaryComponent, FormsModule, CurrencyPipe, TranslocoPipe],
  templateUrl: './booking-payment.component.html',
  styleUrl: './booking-payment.component.scss',
})
export class BookingPaymentComponent {
  private readonly currency = new CurrencyPipe(inject(LOCALE_ID));
  @Input() quote: BookingQuote | undefined;
  // El mismo formulario cobra el saldo de una reserva sin volver a crearla ni cotizarla.
  @Input() additionalPayment = false;
  @Input() balance = 0;
  @Input() busy = false;
  get payableTotal(): number {
    return this.additionalPayment ? this.balance : this.quote?.total ?? 0;
  }
  get minimumPayment(): number {
    return this.additionalPayment ? Math.min(MIN_PAYMENT, this.payableTotal) : MIN_PAYMENT;
  }
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly paySubject = new Subject<CardPayment>();
  @Output('pay') readonly pay$ = this.paySubject.asObservable();
  protected readonly payLaterSubject = new Subject<void>();
  @Output('payLater') readonly payLater$ = this.payLaterSubject.asObservable();
  // Mensajes del backend por campo. Cada uno desaparece cuando se edita su campo.
  fieldErrors: PaymentErrors = {};
  @Input() set serverErrors(value: Record<string, string>) {
    this.fieldErrors = { ...value };
  }
  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
  clearError(field: keyof CardPayment): void {
    delete this.fieldErrors[field];
  }
  amount: number | null = 0;
  cardholderName = '';
  cardNumber = '';
  expiryDate = '';
  securityCode = '';
  submitted = false;
  // Campos que el usuario ya dejó: sus errores se muestran sin esperar al envío.
  private readonly touched = new Set<keyof CardPayment>();
  ngOnInit(): void {
    this.amount = Math.min(this.payableTotal, MAX_PAYMENT);
  }
  touch(field: keyof CardPayment): void {
    this.touched.add(field);
  }
  // Mismas reglas que BookingPaymentValidator en el backend. Devuelve claves de traducción.
  get clientErrors(): PaymentErrors {
    const messages = PAYMENT_MESSAGES;
    const errors: PaymentErrors = {};
    const total = this.payableTotal;
    const amount = this.amount;
    if (amount === null || !Number.isFinite(amount))
      errors.amount = messages.amount.required;
    else if (!hasMaxDecimals(amount, 2))
      errors.amount = messages.amount.decimals;
    else if (amount <= 0 || amount < this.minimumPayment || amount > total)
      errors.amount = 'booking.payment.amountRange';
    else if (amount > MAX_PAYMENT) errors.amount = messages.amount.max;
    const name = this.cardholderName.trim();
    if (!name) errors.cardholderName = messages.cardholderName.required;
    else if (name.length > 100 || !/^[\p{L} .'-]+$/u.test(name))
      errors.cardholderName = messages.cardholderName.letters;
    const digits = this.cardNumber.replace(/\s/g, '');
    if (!digits) errors.cardNumber = messages.cardNumber.required;
    else if (!/^\d{13,19}$/.test(digits))
      errors.cardNumber = messages.cardNumber.length;
    const expiry = this.expiryDate.trim();
    if (!expiry) errors.expiryDate = messages.expiryDate.required;
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry))
      errors.expiryDate = messages.expiryDate.format;
    else {
      const now = new Date();
      const currentMonth = now.getFullYear() * 12 + now.getMonth();
      const expiryMonth =
        (2000 + Number(expiry.slice(3))) * 12 + Number(expiry.slice(0, 2)) - 1;
      if (expiryMonth < currentMonth)
        errors.expiryDate = messages.expiryDate.expired;
      else if (expiryMonth > currentMonth + 20 * 12)
        errors.expiryDate = messages.expiryDate.tooFar;
    }
    const code = this.securityCode.trim();
    if (!code) errors.securityCode = messages.securityCode.required;
    else if (!/^\d{3,4}$/.test(code))
      errors.securityCode = messages.securityCode.length;
    return errors;
  }
  // El mensaje del backend tiene prioridad. El local aparece al dejar el campo o al enviar.
  errorFor(field: keyof CardPayment): string | undefined {
    const serverMessage = this.fieldErrors[field];
    if (serverMessage) return serverMessage;
    if (!this.submitted && !this.touched.has(field)) return undefined;
    const key = this.clientErrors[field];
    return key && translate(key, {
      minimum: this.currency.transform(this.minimumPayment, 'COP', 'symbol', '1.0-2'),
      total: this.currency.transform(this.payableTotal, 'COP', 'symbol', '1.0-2'),
    });
  }
  valid(): boolean {
    return Object.keys(this.clientErrors).length === 0;
  }
  // Solo letras (con tildes y ñ), espacios, puntos, apóstrofes y guiones, como en el backend.
  formatName(control: HTMLInputElement): void {
    this.clearError('cardholderName');
    const value = control.value.replace(/[^\p{L} .'-]/gu, '').slice(0, 100);
    if (value !== control.value) control.value = value;
    this.cardholderName = value;
  }
  formatCardNumber(control: HTMLInputElement): void {
    this.clearError('cardNumber');
    this.format(control, 'card');
  }
  formatExpiry(control: HTMLInputElement): void {
    this.clearError('expiryDate');
    this.format(control, 'expiry');
  }
  // El código de seguridad solo admite 3 o 4 dígitos.
  formatSecurityCode(control: HTMLInputElement): void {
    this.clearError('securityCode');
    const value = control.value.replace(/\D/g, '').slice(0, 4);
    if (value !== control.value) control.value = value;
    this.securityCode = value;
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
    // Una tarjeta tiene como mucho 19 dígitos y la fecha MM/YY, 4.
    const digits = rawDigits.slice(0, kind === 'expiry' ? 4 : 19);
    let formatted = digits;
    if (kind === 'card') {
      const groups: string[] = [];
      for (let index = 0;index < digits.length;index += 4) {
        groups.push(digits.slice(index, index + 4));
      }
      formatted = groups.join(' ');
    } else if (digits.length >= 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (kind === 'card') this.cardNumber = formatted;
    else this.expiryDate = formatted;
    control.value = formatted;
    // Se recoloca el cursor contando dígitos para que los separadores no interrumpan la escritura.
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
    if ((this.quote || this.additionalPayment) && this.amount !== null && this.valid() && !this.busy)
      this.paySubject.next({
        amount: this.amount,
        cardholderName: this.cardholderName.trim(),
        cardNumber: this.cardNumber.replace(/ /g, ''),
        expiryDate: this.expiryDate,
        securityCode: this.securityCode,
      });
  }
}
