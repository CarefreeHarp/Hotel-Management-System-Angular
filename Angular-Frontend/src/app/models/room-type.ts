export interface RoomType {
  roomTypeId: number;
  name: string;
  description: string;
  nightlyPrice: number;
  maxCapacity: number;
  mainPhoto: string;
  secondaryPhotos: string[];
}
