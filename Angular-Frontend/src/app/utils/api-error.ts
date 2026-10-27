import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { translate } from '@jsverse/transloco';

/** Cuerpo de error que devuelve ApiExceptionHandler en Spring Boot. */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

/** El cuerpo HTTP es externo: solo se aceptan mensajes y errores de campo que sean texto. */
function apiBody(error: unknown): Partial<ApiError> {
  const body: unknown = error instanceof HttpErrorResponse ? error.error : undefined;
  if (!body || typeof body !== 'object') return {};
  const result: Partial<ApiError> = {};
  if ('message' in body && typeof body.message === 'string') {
    result.message = body.message;
  }
  if ('fieldErrors' in body && body.fieldErrors && typeof body.fieldErrors === 'object') {
    const fields: Record<string, string> = {};
    for (const [field, message] of Object.entries(body.fieldErrors)) {
      if (typeof message === 'string') fields[field] = message;
    }
    result.fieldErrors = fields;
  }
  return result;
}

/**
 * Mensaje de una petición fallida según su código HTTP: sin conexión y los
 * errores 5xx tienen su propio texto, sin detalles técnicos. Los demás
 * muestran el motivo que explica el backend, que llega en inglés.
 * fallbackKey es la clave de traducción del mensaje cuando no hay otro mejor;
 * params completa sus marcadores, por ejemplo { name: 'Ana' }.
 */
export function apiErrorMessage(
  error: unknown,
  fallbackKey = 'api.default',
  params: Record<string, unknown> = {},
): string {
  if (!(error instanceof HttpErrorResponse))
    return error instanceof Error && error.message ? error.message : translate(fallbackKey, params);
  if (error.status === 0) return translate('api.offline');
  if (error.status >= 500) return translate('api.serverError');
  const message = apiBody(error).message?.trim();
  if (message) return message;
  switch (error.status) {
    case 400:
      return translate('api.badRequest');
    case 401:
      return translate('api.unauthorized');
    case 404:
      return translate('api.notFound');
    case 409:
      return translate('api.conflict');
    default:
      return translate(fallbackKey, params);
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
 * del backend a rutas de controles, por ejemplo { roomType: 'roomTypeId' }.
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
