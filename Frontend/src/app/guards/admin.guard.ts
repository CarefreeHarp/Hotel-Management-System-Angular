import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdministratorService } from '../services/administrator.service';

/**
 * Protege /admin/:adminId y todas sus páginas. La id del administrador viene en
 * la URL: si la pestaña se recargó, se pide ese administrador al backend y se
 * vuelve a abrir la sesión. Con una sesión abierta solo se entra al propio panel.
 */
export const adminGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const administratorService = inject(AdministratorService);
  const router = inject(Router);
  const adminId = Number(route.paramMap.get('adminId'));
  const staffLogin = router.createUrlTree(['/login'], { queryParams: { portal: 'staff' } });

  if (authService.isLoggedIn()) {
    return authService.adminId() === adminId ? true : router.parseUrl(authService.homeUrl());
  }
  if (authService.hasLoggedOut()) return staffLogin;

  return administratorService.getById(adminId).pipe(
    map((administrator) => {
      authService.openAdminSession(administrator);
      return true;
    }),
    catchError(() => of(staffLogin)),
  );
};
