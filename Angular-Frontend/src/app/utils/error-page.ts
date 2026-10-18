import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, OperatorFunction, catchError } from 'rxjs';
import { basePath } from './base-path';

/**
 * Pantallas de error: 400 y 404 cuando la dirección no sirve (un valor inválido o
 * algo que no existe); 500 y 503 cuando falla o no responde el servidor.
 */
export type ErrorPageCode = 400 | 404 | 500 | 503;

/** Pantalla que corresponde a un fallo al cargar la información principal de una página. */
export function errorPageCode(error: unknown): ErrorPageCode {
  if (!(error instanceof HttpErrorResponse)) return 500;
  if (error.status === 0) return 503;
  if (error.status >= 500) return 500;
  return error.status === 404 ? 404 : 400;
}

/**
 * Muestra la pantalla de error dentro del área actual (sitio público,
 * /admin/:adminId u /operator/:operatorId) sin cambiar la URL: al recargar o
 * pulsar "Try again" se vuelve a pedir la página original.
 *
 * Solo se usa cuando falla la carga de lo que la página existe para mostrar. Los
 * errores al guardar formularios, en acciones como borrar o activar, en el login
 * o en las reglas de la reserva se muestran en la propia página.
 */
export function showErrorPage(
  router: Router,
  route: ActivatedRoute,
  code: ErrorPageCode,
): void {
  void router.navigate([basePath(route), 'error', code], {
    skipLocationChange: true,
    queryParamsHandling: 'preserve',
  });
}

/**
 * Para la carga principal de una página: si la petición falla, muestra la
 * pantalla que corresponde y no emite nada, así la página no queda a medias.
 */
export function catchErrorPage<T>(
  router: Router,
  route: ActivatedRoute,
): OperatorFunction<T, T> {
  return catchError((error: unknown) => {
    showErrorPage(router, route, errorPageCode(error));
    return EMPTY;
  });
}
