import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FrontDeskBoard } from '../models/front-desk';

@Injectable({ providedIn: 'root' })
export class FrontDeskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/front-desk';

  // El backend usa su propia fecha para decidir qué es "hoy".
  getBoard(): Observable<FrontDeskBoard> {
    return this.http.get<FrontDeskBoard>(this.apiUrl);
  }
}
