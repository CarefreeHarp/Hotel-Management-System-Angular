import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { BookingStay, RoomTypeAvailability } from '../../../../models/booking';
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
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly changeDatesSubject = new Subject<void>();
  @Output('changeDates') readonly changeDates$ = this.changeDatesSubject.asObservable();
  @Input({ required: true }) types: RoomTypeAvailability[] = [];
  protected readonly selectedSubject = new Subject<number>();
  @Output('selected') readonly selected$ = this.selectedSubject.asObservable();
}
