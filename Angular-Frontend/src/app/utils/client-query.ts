import { ActivatedRoute } from '@angular/router';

/** Client context is read from the current URL; it is never stored as a session. */
export function clientIdFromUrl(route: ActivatedRoute): number | undefined {
  const value = Number(route.snapshot.queryParamMap.get('auth'));
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function clientQuery(route: ActivatedRoute): { auth?: number } {
  const auth = clientIdFromUrl(route);
  return auth === undefined ? {} : { auth };
}
