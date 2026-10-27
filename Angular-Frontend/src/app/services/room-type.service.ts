import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { translate } from '@jsverse/transloco';
import { Observable, concatMap, map } from 'rxjs';
import { RoomTypeDetailDTO } from '../models/dto/room-type-detail-dto';
import { RoomTypeListDTO } from '../models/dto/room-type-list-dto';
import { RoomTypeOptionDTO } from '../models/dto/room-type-option-dto';
import { RoomType } from '../models/room-type';

@Injectable({
  providedIn: 'root',
})
export class RoomTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/room-types';

  getAll(): Observable<RoomTypeListDTO[]> {
    return this.http.get<RoomTypeListDTO[]>(this.apiUrl);
  }

  // Solo id y nombre, para el selector del formulario de habitaciones.
  getOptions(): Observable<RoomTypeOptionDTO[]> {
    return this.http.get<RoomTypeOptionDTO[]>(`${this.apiUrl}/options`);
  }

  getById(id: number): Observable<RoomTypeDetailDTO> {
    return this.http.get<RoomTypeDetailDTO>(`${this.apiUrl}/${id}`);
  }

  // El POST devuelve un cuerpo vacío. concatMap espera su respuesta antes de consultar el id para navegar.
  add(roomType: Omit<RoomType, 'roomTypeId'>): Observable<RoomTypeListDTO> {
    return this.http.post<void>(this.apiUrl, roomType).pipe(
      concatMap(() => this.getAll()),
      map((roomTypes) => {
        const created = roomTypes.find(
          (rt) => rt.name.trim().toLowerCase() === roomType.name.trim().toLowerCase(),
        );
        if (!created) {
          throw new Error(translate('api.createdNotFound'));
        }
        return created;
      }),
    );
  }

  update(id: number, roomType: RoomType): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, roomType);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
