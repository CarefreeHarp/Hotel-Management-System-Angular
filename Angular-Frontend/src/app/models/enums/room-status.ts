export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
}

// Texto de cada estado físico en tablas, formularios y el tablero del operario.
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: 'Available',
  [RoomStatus.OCCUPIED]: 'Occupied',
  [RoomStatus.CLEANING]: 'Cleaning',
  [RoomStatus.MAINTENANCE]: 'Maintenance',
};
