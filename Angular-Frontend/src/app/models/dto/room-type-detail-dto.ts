// Detalle y formulario de un tipo: todos sus atributos, como RoomTypeDetailDTO en el backend.
export interface RoomTypeDetailDTO {
  roomTypeId: number;
  name: string;
  description: string;
  nightlyPrice: number;
  maxCapacity: number;
  mainPhoto: string;
  secondaryPhotos: string[];
}
