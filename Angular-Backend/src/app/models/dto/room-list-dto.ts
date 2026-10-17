import type { RoomStatus } from '../enums/room-status';

// Fila de la tabla de habitaciones: mismos atributos que RoomListDTO en el backend.
export interface RoomListDTO {
  roomId: number;
  number: number;
  floor: number;
  status: RoomStatus;
  // Decide en qué sección se muestra: activas o inactivas.
  active: boolean;
  roomTypeName: string;
  mainPhoto: string;
}
