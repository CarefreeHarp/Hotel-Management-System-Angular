import { Injectable } from '@angular/core';
import { RoomType } from '../models/room-type';

@Injectable({
  providedIn: 'root',
})
export class RoomTypeService {
  // Datos quemados: los mismos tipos de habitación que cargaba DataLoader en Spring Boot.
  private roomTypes: RoomType[] = [
    {
      roomTypeId: 1,
      name: 'Standard Room',
      description:
        'A comfortable room with a queen bed, work desk and private bathroom.',
      nightlyPrice: 250000,
      maxCapacity: 2,
      mainPhoto: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
      secondaryPhotos: [
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
      ],
    },
    {
      roomTypeId: 2,
      name: 'Deluxe Room',
      description:
        'A spacious room with a king bed, lounge area and panoramic city views.',
      nightlyPrice: 360000,
      maxCapacity: 2,
      mainPhoto: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      secondaryPhotos: [
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
      ],
    },
    {
      roomTypeId: 3,
      name: 'Executive Room',
      description:
        'A refined room with a dedicated workspace, premium amenities and lounge access.',
      nightlyPrice: 450000,
      maxCapacity: 3,
      mainPhoto: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      secondaryPhotos: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061',
      ],
    },
    {
      roomTypeId: 4,
      name: 'Family Suite',
      description:
        'A two-room suite designed for families, with extra beds and a generous living area.',
      nightlyPrice: 590000,
      maxCapacity: 5,
      mainPhoto: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
      secondaryPhotos: [
        'https://images.unsplash.com/photo-1564078516393-cf04bd966897',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
      ],
    },
    {
      roomTypeId: 5,
      name: 'Presidential Suite',
      description:
        'Our signature suite with a private terrace, jacuzzi and personalized guest service.',
      nightlyPrice: 950000,
      maxCapacity: 6,
      mainPhoto: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      secondaryPhotos: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      ],
    },
  ];

  // Siguiente id disponible, como el IDENTITY de la base de datos del proyecto anterior.
  private nextId = 6;

  // Devuelve una copia para que los componentes no modifiquen el arreglo del servicio.
  getAll(): RoomType[] {
    return [...this.roomTypes];
  }

  getById(id: number): RoomType | undefined {
    return this.roomTypes.find((roomType) => roomType.roomTypeId === id);
  }

  // El formulario no envía el id: el servicio lo asigna al crear el registro.
  add(roomType: Omit<RoomType, 'roomTypeId'>): RoomType {
    const newRoomType: RoomType = { ...roomType, roomTypeId: this.nextId++ };
    this.roomTypes.push(newRoomType);
    return newRoomType;
  }

  update(id: number, roomType: RoomType): void {
    const index = this.roomTypes.findIndex(
      (current) => current.roomTypeId === id,
    );
    if (index !== -1) {
      this.roomTypes[index] = roomType;
    }
  }

  delete(id: number): void {
    const index = this.roomTypes.findIndex(
      (roomType) => roomType.roomTypeId === id,
    );
    if (index !== -1) {
      this.roomTypes.splice(index, 1);
    }
  }
}
