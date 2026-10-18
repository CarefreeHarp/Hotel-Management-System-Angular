import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, Input, output } from '@angular/core';
import { BookingStay } from '../../../../models/booking';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
@Component({
  selector: 'app-booking-room-types',
  imports: [OptimizedImageDirective, CurrencyPipe, DatePipe],
  templateUrl: './booking-room-types.component.html',
  styleUrl: './booking-room-types.component.scss',
})
export class BookingRoomTypesComponent {
  @Input({ required: true }) stay: BookingStay = {
    checkIn: '',
    checkOut: '',
    guests: 1,
  };
  readonly changeDates = output<void>();
  @Input({ required: true }) types: RoomTypeListDTO[] = [];
  readonly selected = output<number>();
}
