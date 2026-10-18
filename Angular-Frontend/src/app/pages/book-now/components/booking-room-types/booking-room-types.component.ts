import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, input, output } from '@angular/core';
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
  readonly stay = input.required<BookingStay>();
  readonly changeDates = output<void>();
  readonly types = input.required<RoomTypeListDTO[]>();
  readonly selected = output<number>();
}
