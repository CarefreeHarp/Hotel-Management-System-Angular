import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ClientService } from '../services/client.service';

/**
 * Protege /client/:clientId y todas sus páginas. La id del cliente viene en la
 * URL: si la pestaña se recargó, se pide ese cliente al backend y se vuelve a
 * abrir la sesión. Con una sesión abierta solo se entra al propio perfil.
 */
export const clientGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const clientService = inject(ClientService);
  const router = inject(Router);
  const clientId = Number(route.paramMap.get('clientId'));
  const clientLogin = router.createUrlTree(['/login'], { queryParams: { portal: 'client' } });

  if (authService.isLoggedIn()) {
    return authService.clientId() === clientId ? true : router.parseUrl(authService.homeUrl());
  }
  if (authService.hasLoggedOut()) return clientLogin;

  return clientService.getById(clientId).pipe(
    map((client) => {
      authService.openClientSession(client);
      return true;
    }),
    catchError(() => of(clientLogin)),
  );
};
