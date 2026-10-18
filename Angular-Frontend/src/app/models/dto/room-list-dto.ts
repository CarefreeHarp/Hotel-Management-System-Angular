import type { ActivationStatus } from '../enums/activation-status';
import type { RoomStatus } from '../enums/room-status';

// Fila de la tabla de habitaciones: mismos atributos que RoomListDTO en el backend.
export interface RoomListDTO {
  roomId: number;
  number: number;
  floor: number;
  status: RoomStatus;
  activationStatus: ActivationStatus;
  roomTypeName: string;
  mainPhoto: string;
}
