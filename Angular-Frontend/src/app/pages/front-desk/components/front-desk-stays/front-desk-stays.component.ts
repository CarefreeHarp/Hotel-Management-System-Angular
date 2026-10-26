import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { stayNights } from '../../../../models/booking';
import { RoomStatus } from '../../../../models/enums/room-status';
import { FrontDeskStay } from '../../../../models/front-desk';

export type StayListKind = 'arrival' | 'in-house' | 'departure';

interface StayTag {
  label: string;
  css: string;
}

const CAPTIONS: Record<StayListKind, string> = {
  arrival: 'Arrivals expected today',
  'in-house': 'Guests currently checked in',
  departure: 'Departures due today or overdue',
};

const EMPTY_MESSAGES: Record<StayListKind, string> = {
  arrival: 'No arrivals are pending for today.',
  'in-house': 'No guests are checked in.',
  departure: 'No departures are pending.',
};

/** Tabla de estancias del tablero. Emite las acciones al padre, que llama a la API y recarga el tablero. */
@Component({
  selector: 'app-front-desk-stays',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './front-desk-stays.component.html',
  styleUrl: './front-desk-stays.component.scss',
})
export class FrontDeskStaysComponent {
  @Input({ required: true }) kind: StayListKind = 'arrival';
  @Input({ required: true }) stays: FrontDeskStay[] = [];
  // Fecha del servidor: decide las llegadas atrasadas y las salidas vencidas.
  @Input({ required: true }) today = '';
  @Input({ required: true }) base = '';
  @Input() busy = false;
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly checkInSubject = new Subject<FrontDeskStay>();
  protected readonly checkOutSubject = new Subject<FrontDeskStay>();
  @Output('checkIn') readonly checkIn$ = this.checkInSubject.asObservable();
  @Output('checkOut') readonly checkOut$ = this.checkOutSubject.asObservable();
  // El detalle ofrece el cobro en efectivo y vuelve al tablero.
  readonly detailParams = { from: 'front-desk' };

  get caption(): string {
    return CAPTIONS[this.kind];
  }

  get emptyMessage(): string {
    return EMPTY_MESSAGES[this.kind];
  }

  nights(stay: FrontDeskStay): number {
    return stayNights(stay.checkInDate, stay.checkOutDate);
  }

  /** Llegada atrasada, salida de hoy o salida vencida. */
  dateTag(stay: FrontDeskStay): StayTag | undefined {
    if (this.kind === 'arrival') {
      return stay.checkInDate < this.today ? { label: 'Late arrival', css: 'chip--warning' } : undefined;
    }
    if (stay.checkOutDate < this.today) return { label: 'Overdue departure', css: 'chip--alert' };
    return this.kind === 'in-house' && stay.checkOutDate === this.today
      ? { label: 'Departs today', css: 'chip--cleaning' }
      : undefined;
  }

  /** El check-in solo se ofrece con la habitación disponible; el backend repite la comprobación. */
  roomTag(stay: FrontDeskStay): StayTag {
    switch (stay.roomStatus) {
      case RoomStatus.AVAILABLE:
        return { label: 'Room ready', css: 'chip--ready' };
      case RoomStatus.CLEANING:
        return { label: 'Being cleaned', css: 'chip--cleaning' };
      case RoomStatus.MAINTENANCE:
        return { label: 'Under maintenance', css: 'chip--maintenance' };
      case RoomStatus.OCCUPIED:
        return { label: 'Still occupied', css: 'chip--alert' };
      default:
        return { label: 'No room assigned', css: 'chip--alert' };
    }
  }
}
