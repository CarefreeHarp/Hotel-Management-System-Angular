import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
@Component({ selector: 'app-booking-room-types', imports: [CurrencyPipe], templateUrl: './booking-room-types.component.html', styleUrl: './booking-room-types.component.scss' })
export class BookingRoomTypesComponent {
    readonly types = input.required<RoomTypeListDTO[]>();
    readonly selected = output<number>();
}
