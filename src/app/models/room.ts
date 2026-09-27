import type { RoomStatus } from './enums/room-status';
import type { RoomType } from './room-type';

export interface Room {
  roomId: number;
  number: number;
  floor: number;
  status: RoomStatus;
  roomType: RoomType;
}
