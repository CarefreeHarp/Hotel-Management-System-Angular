import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';

/** Cuerpo de error que devuelve ApiExceptionHandler en Spring Boot. */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

function apiBody(error: unknown): Partial<ApiError> {
  return error instanceof HttpErrorResponse &&
    error.error &&
    typeof error.error === 'object'
    ? (error.error as Partial<ApiError>)
    : {};
}

/**
 * Mensaje de una petición fallida según su código HTTP: sin conexión y los
 * errores 5xx tienen su propio texto, sin detalles técnicos; los demás
 * muestran el motivo que explica el backend.
 */
export function apiErrorMessage(
  error: unknown,
  fallback = 'The request could not be completed. Please try again.',
): string {
  if (!(error instanceof HttpErrorResponse))
    return error instanceof Error && error.message ? error.message : fallback;
  if (error.status === 0)
    return 'The server could not be reached. Check your connection and that the backend is running, then try again.';
  if (error.status >= 500)
    return 'The server could not process the request. Please try again in a few moments.';
  const message = apiBody(error).message?.trim();
  if (message) return message;
  switch (error.status) {
    case 400:
      return 'Some of the information is not valid. Please review it and try again.';
    case 401:
      return 'Incorrect email or password.';
    case 404:
      return 'The requested record does not exist or was deleted.';
    case 409:
      return 'The change conflicts with information that already exists.';
    default:
      return fallback;
  }
}

/** Mensaje del backend para cada campo rechazado (fieldErrors). */
export function apiFieldErrors(error: unknown): Record<string, string> {
  return apiBody(error).fieldErrors ?? {};
}

/**
 * Muestra cada error de campo del backend bajo su control, como el error
 * `server`, y devuelve el texto para la alerta del formulario: vacío cuando
 * todos los problemas ya se ven en sus campos. `fields` traduce los nombres
 * del backend a rutas de controles, por ejemplo { roomType: 'roomTypeId' };
 * secondaryPhotos[1] se busca como secondaryPhotos.1.
 */
export function showApiErrors(
  form: FormGroup,
  error: unknown,
  fields: Record<string, string> = {},
): string {
  const errors = Object.entries(apiFieldErrors(error));
  if (!errors.length) return apiErrorMessage(error);
  const unmatched: string[] = [];
  for (const [field, message] of errors) {
    const control = form.get(
      fields[field] ?? field.replace(/\[(\d+)\]/g, '.$1'),
    );
    if (control instanceof FormControl && control.enabled) {
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
    } else unmatched.push(message);
  }
  return unmatched.join(' ');
}

/**
 * Quita los errores del backend antes de validar y enviar de nuevo: cada
 * control vuelve a calcular solo sus propias reglas, de los campos al grupo.
 */
export function clearApiErrors(control: AbstractControl): void {
  if (control instanceof FormGroup || control instanceof FormArray)
    Object.values(control.controls).forEach(clearApiErrors);
  control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
}
