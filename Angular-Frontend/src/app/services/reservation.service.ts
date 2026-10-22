import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BookingDraft,
  BookingQuote,
  BookingStay,
  CardPayment,
  ReservationDetails,
} from '../models/booking';
import { ReservationDTO } from '../models/dto/reservation-dto';
import { RoomTypeListDTO } from '../models/dto/room-type-list-dto';
import { ReservationStatus } from '../models/enums/reservation-status';

export interface ReservationUpdate extends BookingDraft {
  status: ReservationStatus;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/reservations';

  getAll(): Observable<ReservationDTO[]> {
    return this.http.get<ReservationDTO[]>(this.apiUrl);
  }

  getByClientId(clientId: number): Observable<ReservationDTO[]> {
    return this.http.get<ReservationDTO[]>(this.apiUrl, {
      params: { clientId },
    });
  }

  getById(id: number): Observable<ReservationDTO> {
    return this.http.get<ReservationDTO>(`${this.apiUrl}/${id}`);
  }
  available(stay: BookingStay): Observable<RoomTypeListDTO[]> {
    return this.http.get<RoomTypeListDTO[]>(
      `${this.apiUrl}/available-room-types`,
      { params: { ...stay } },
    );
  }
  quote(draft: BookingDraft): Observable<BookingQuote> {
    return this.http.get<BookingQuote>(`${this.apiUrl}/quote`, {
      params: {
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guests: draft.guests,
        roomTypeId: draft.roomTypeId,
        serviceIds: draft.serviceIds,
      },
    });
  }
  // La API recibe relaciones con identificadores. Asigna la habitación y fija los precios en el backend.
  create(
    clientId: number,
    draft: BookingDraft,
    payment?: CardPayment,
  ): Observable<ReservationDetails> {
    const body = {
      client: { clientId },
      room: { roomType: { roomTypeId: draft.roomTypeId } },
      checkInDate: draft.checkIn,
      checkOutDate: draft.checkOut,
      guestCount: draft.guests,
      services: draft.serviceIds.map((serviceId) => ({ serviceId })),
    };
    return this.http.post<ReservationDetails>(
      this.apiUrl,
      payment ? { ...body, initialPayment: payment } : body,
    );
  }
  // La edición no reenvía pagos: solo cambia estancia, servicios y estado.
  update(id: number, draft: ReservationUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, {
      checkInDate: draft.checkIn,
      checkOutDate: draft.checkOut,
      guestCount: draft.guests,
      room: { roomType: { roomTypeId: draft.roomTypeId } },
      services: draft.serviceIds.map((serviceId) => ({ serviceId })),
      status: draft.status,
    });
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  details(id: number): Observable<ReservationDetails> {
    return this.http.get<ReservationDetails>(`${this.apiUrl}/${id}/details`);
  }
  history(clientId: number): Observable<ReservationDetails[]> {
    return this.http.get<ReservationDetails[]>(`${this.apiUrl}/history`, {
      params: { clientId },
    });
  }
}
