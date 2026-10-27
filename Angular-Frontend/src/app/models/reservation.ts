import type { ReservationStatus } from './enums/reservation-status';
import type { Room } from './room';

// Las pantallas reciben DTOs de reserva y consultan al cliente por su identificador.
export interface Reservation {
  reservationId: number;
  reservationCode: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  nightlyPrice: number;
  status: ReservationStatus;
  createdAt: string;
  room?: Room;
}
