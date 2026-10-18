import type { ReservationStatus } from './enums/reservation-status';
import type { Room } from './room';

// El backend no envía el cliente (JsonIgnore): las reservas se piden por cliente.
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
