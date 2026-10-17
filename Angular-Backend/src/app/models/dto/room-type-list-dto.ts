// Fila de la tabla de tipos y tarjeta de la landing: mismos atributos que RoomTypeListDTO en el backend.
export interface RoomTypeListDTO {
  roomTypeId: number;
  name: string;
  description: string;
  nightlyPrice: number;
  maxCapacity: number;
  mainPhoto: string;
}
