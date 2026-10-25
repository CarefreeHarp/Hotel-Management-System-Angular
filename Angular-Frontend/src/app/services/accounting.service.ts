import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountingDashboard, AccountingFilters } from '../models/accounting';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly http = inject(HttpClient);

  /** Pide solo agregados ya calculados por el backend, nunca listas completas de reservas o movimientos. */
  getDashboard(filters: AccountingFilters): Observable<AccountingDashboard> {
    return this.http.get<AccountingDashboard>(
      'http://localhost:8080/accounting',
      {
        params: { ...filters },
      },
    );
  }
}
