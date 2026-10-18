import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservationDTO } from '../../../../models/dto/reservation-dto';
@Component({
  selector: 'app-reservation-table',
  imports: [DatePipe, RouterLink],
  templateUrl: './reservation-table.component.html',
  styleUrl: './reservation-table.component.scss',
})
export class ReservationTableComponent {
  @Input() reservations: ReservationDTO[] = [];
  @Input({ required: true }) base = '';
  @Input() busy = false;
  @Output() deleteRecord = new EventEmitter<number>();
  nights(item: ReservationDTO): number {
    return Math.round(
      (Date.parse(item.checkOutDate) - Date.parse(item.checkInDate)) / 86400000,
    );
  }
}
