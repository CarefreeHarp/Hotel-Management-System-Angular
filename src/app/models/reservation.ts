import type { Client } from './client';
import type { ReservationStatus } from './enums/reservation-status';
import type { Room } from './room';

export interface Reservation {
  reservationId: number;
  reservationCode: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  nightlyPrice: number;
  status: ReservationStatus;
  createdAt: string;
  client?: Client;
  room?: Room;
}
