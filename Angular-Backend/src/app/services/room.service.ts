import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Room } from '../models/room';
import { RoomListDTO } from '../models/dto/room-list-dto';
import { RoomDetailDTO } from '../models/dto/room-detail-dto';

// El formulario no envía active: lo deciden los botones de activar y desactivar.
export type RoomData = Omit<Room, 'roomId' | 'roomType' | 'active'> & {
  roomType: { roomTypeId: number };
};

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/rooms';
  // Filas de la tabla, activas e inactivas.
  getAll(): Observable<RoomListDTO[]> {
    return this.http.get<RoomListDTO[]>(this.apiUrl);
  }
  getById(id: number): Observable<RoomDetailDTO> {
    return this.http.get<RoomDetailDTO>(this.apiUrl + '/' + id);
  }
  add(room: RoomData): Observable<RoomListDTO> {
    return this.http.post<void>(this.apiUrl, room).pipe(
      switchMap(() => this.getAll()),
      map((rooms) => {
        const created = rooms.find((item) => item.number === room.number);
        if (!created) throw new Error('Created room could not be retrieved.');
        return created;
      }),
    );
  }
  update(id: number, room: RoomData): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id, room);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl + '/' + id);
  }
  // PUT sin cuerpo: el backend solo cambia el atributo active de la habitación.
  activate(id: number): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id + '/activate', null);
  }
  deactivate(id: number): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id + '/deactivate', null);
  }
}
