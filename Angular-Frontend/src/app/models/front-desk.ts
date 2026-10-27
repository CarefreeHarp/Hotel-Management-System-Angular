import type { ReservationStatus } from './enums/reservation-status';
import type { RoomStatus } from './enums/room-status';

// Estancia del tablero: mismos atributos que FrontDeskBoard.Stay en el backend.
export interface FrontDeskStay {
  reservationId: number;
  reservationCode: string;
  clientId?: number;
  guestName?: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  roomNumber?: number;
  roomTypeName?: string;
  roomStatus?: RoomStatus;
  // Total menos pagado neto, igual que el saldo del detalle de la reserva.
  balance: number;
}

export interface FrontDeskRoom {
  roomId: number;
  number: number;
  floor: number;
  roomTypeName: string;
  status: RoomStatus;
  // Hay una llegada asignada que todavía no hizo check-in.
  arrivalExpected: boolean;
}

// Las salidas pendientes también están en inHouse: siguen alojadas hasta el check-out.
export interface FrontDeskBoard {
  date: string;
  arrivals: FrontDeskStay[];
  inHouse: FrontDeskStay[];
  departures: FrontDeskStay[];
  rooms: FrontDeskRoom[];
}
