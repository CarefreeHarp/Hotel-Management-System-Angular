import type { ReservationStatus } from '../enums/reservation-status';

// Reserva tal como la muestra el perfil del cliente: como ReservationDTO en el backend.
export interface ReservationDTO {
  reservationId: number;
  reservationCode: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: ReservationStatus;
  roomNumber?: number;
  roomTypeId?: number;
  roomTypeName?: string;
  clientId?: number;
  clientName?: string;
  createdAt?: string;
  roomTypeMainPhoto?: string;
}
