import { ActivatedRoute } from '@angular/router';

/** El contexto del cliente se lee de la URL actual. Nunca se guarda como una sesión. */
export function clientIdFromUrl(route: ActivatedRoute): number | undefined {
  const value = Number(route.snapshot.queryParamMap.get('auth'));
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function clientQuery(route: ActivatedRoute): { auth?: number } {
  const auth = clientIdFromUrl(route);
  return auth === undefined ? {} : { auth };
}
