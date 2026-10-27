import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BookingDraft,
  BookingQuote,
  BookingStay,
  CardPayment,
  ReservationDetails,
  RoomTypeAvailability,
} from '../models/booking';
import { ReservationDTO } from '../models/dto/reservation-dto';
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
  available(stay: BookingStay): Observable<RoomTypeAvailability[]> {
    return this.http.get<RoomTypeAvailability[]>(
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
  /** La edición del cliente no envía estado, precios ni tipo de habitación. */
  updateForClient(id: number, clientId: number, draft: BookingDraft): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/client`, {
      checkInDate: draft.checkIn,
      checkOutDate: draft.checkOut,
      guestCount: draft.guests,
      services: draft.serviceIds.map((serviceId) => ({ serviceId })),
    }, { params: { clientId } });
  }
  addPayment(id: number, clientId: number, payment: CardPayment): Observable<ReservationDetails> {
    return this.http.post<ReservationDetails>(`${this.apiUrl}/${id}/payments`, payment, {
      params: { clientId },
    });
  }
  /** El operador envía solo el importe. El backend registra CASH y su identificador. */
  addCashPayment(id: number, operatorId: number, amount: number): Observable<ReservationDetails> {
    return this.http.post<ReservationDetails>(`${this.apiUrl}/${id}/cash-payments`, { amount }, {
      params: { operatorId },
    });
  }
  /** Cancela sin reenviar la estancia ni recalcular sus precios históricos. */
  cancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancel`, null);
  }
  /** El backend también marca la habitación como ocupada. */
  checkIn(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/check-in`, null);
  }
  /** Exige saldo cero y deja la habitación en limpieza. */
  checkOut(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/check-out`, null);
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
