import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationDTO } from '../models/dto/reservation-dto';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/reservations';

  getByClientId(clientId: number): Observable<ReservationDTO[]> {
    return this.http.get<ReservationDTO[]>(this.apiUrl, { params: { clientId } });
  }

  getById(id: number): Observable<ReservationDTO> {
    return this.http.get<ReservationDTO>(`${this.apiUrl}/${id}`);
  }
}
