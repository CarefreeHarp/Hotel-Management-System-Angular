import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OperatorService } from '../services/operator.service';
export const operatorGuard: CanActivateFn = (route) => {
    const auth = inject(AuthService);
    const operators = inject(OperatorService);
    const router = inject(Router);
    const id = Number(route.paramMap.get('operatorId'));
    const login = router.createUrlTree(['/login'], { queryParams: { portal: 'staff' } });
    if (!Number.isSafeInteger(id) || id < 1 || auth.hasLoggedOut())
        return login;
    if (auth.isLoggedIn())
        return auth.isOperator() && auth.session()?.staff?.id === id ? true : router.parseUrl(auth.homeUrl());
    return operators.getById(id).pipe(map(operator => { auth.openOperatorSession(operator); return true; }), catchError(() => of(login)));
};
