import { DatePipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { MILLISECONDS_PER_DAY } from '../../../../models/booking';
import { ReservationDTO } from '../../../../models/dto/reservation-dto';
@Component({
  selector: 'app-reservation-table',
  imports: [DatePipe, RouterLink, TranslocoPipe],
  templateUrl: './reservation-table.component.html',
  styleUrl: './reservation-table.component.scss',
})
export class ReservationTableComponent {
  @Input() reservations: ReservationDTO[] = [];
  @Input({ required: true }) base = '';
  @Input() busy = false;
  protected readonly deleteRecordSubject = new Subject<number>();
  @Output('deleteRecord') readonly deleteRecord$ = this.deleteRecordSubject.asObservable();
  nights(item: ReservationDTO): number {
    return Math.round(
      (Date.parse(item.checkOutDate) - Date.parse(item.checkInDate)) / MILLISECONDS_PER_DAY,
    );
  }
}
