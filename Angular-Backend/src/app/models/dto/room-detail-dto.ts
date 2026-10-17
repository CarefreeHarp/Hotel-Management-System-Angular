import type { RoomStatus } from '../enums/room-status';
import type { RoomTypeDetailDTO } from './room-type-detail-dto';

// Detalle y formulario de una habitación: mismos atributos que RoomDetailDTO en el backend.
export interface RoomDetailDTO {
  roomId: number;
  number: number;
  floor: number;
  status: RoomStatus;
  roomType: RoomTypeDetailDTO;
}
