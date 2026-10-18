import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/*
 * Reglas compartidas por los formularios. Usan las mismas expresiones y límites
 * que Bean Validation en las entidades del backend: Angular las revisa antes de
 * enviar y el backend las vuelve a revisar (restricciones redundantes).
 */

function text(control: AbstractControl): string {
  return String(control.value ?? '').trim();
}

function isEmpty(control: AbstractControl): boolean {
  return control.value === null || control.value === '';
}

/** Obligatorio sin contar los espacios, como @NotBlank. */
export function requiredText(control: AbstractControl): ValidationErrors | null {
  return text(control) ? null : { required: true };
}

/** Correo con dominio y extensión: la misma expresión que @Email(regexp) en el backend. */
export function emailAddress(control: AbstractControl): ValidationErrors | null {
  const value = text(control);
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? null
    : { email: true };
}

/** URL opcional que empieza por http:// o https://, como el @Pattern de las fotos. */
export function photoUrl(control: AbstractControl): ValidationErrors | null {
  const value = text(control);
  return !value || /^https?:\/\/\S+$/.test(value) ? null : { photoUrl: true };
}

/** Cédula de 5 a 20 letras (con tildes y ñ) o números, sin espacios ni símbolos (Client.nationalId). */
export function nationalId(control: AbstractControl): ValidationErrors | null {
  const value = text(control);
  return !value || /^[\p{L}0-9]{5,20}$/u.test(value)
    ? null
    : { nationalId: true };
}

/** Teléfono de 7 a 15 dígitos, con + opcional al inicio (Client.phone). */
export function phoneNumber(control: AbstractControl): ValidationErrors | null {
  const value = text(control);
  return !value || /^\+?[0-9]{7,15}$/.test(value) ? null : { phone: true };
}

/** Número entero, para los campos que el backend guarda como Integer. */
export function wholeNumber(control: AbstractControl): ValidationErrors | null {
  return isEmpty(control) || Number.isInteger(control.value)
    ? null
    : { integer: true };
}

/** Mayor que cero, como @Positive. */
export function positive(control: AbstractControl): ValidationErrors | null {
  return isEmpty(control) || Number(control.value) > 0
    ? null
    : { positive: true };
}

/** Como mucho `places` decimales, como @Digits(fraction = 2). */
export function maxDecimals(places: number): ValidatorFn {
  return (control) =>
    isEmpty(control) || hasMaxDecimals(Number(control.value), places)
      ? null
      : { decimals: true };
}

// También la usa el pago de la reserva, que no es un formulario reactivo.
export function hasMaxDecimals(value: number, places: number): boolean {
  return Number.isFinite(value) && Number(value.toFixed(places)) === value;
}
