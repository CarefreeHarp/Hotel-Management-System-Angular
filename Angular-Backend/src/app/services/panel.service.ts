import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PanelCounts } from '../models/panel-counts';

@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/panel';

  // El backend cuenta con SELECT COUNT(*): no se descargan los registros completos.
  getCounts(): Observable<PanelCounts> {
    return this.http.get<PanelCounts>(`${this.apiUrl}/counts`);
  }
}
