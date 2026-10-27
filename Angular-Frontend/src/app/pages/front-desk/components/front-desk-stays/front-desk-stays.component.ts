import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { stayNights } from '../../../../models/booking';
import { RoomStatus } from '../../../../models/enums/room-status';
import { FrontDeskStay } from '../../../../models/front-desk';

export type StayListKind = 'arrival' | 'in-house' | 'departure';

// labelKey es la clave de traducción de la etiqueta.
interface StayTag {
  labelKey: string;
  css: string;
}

/** Tabla de estancias del tablero. Emite las acciones al padre, que llama a la API y recarga el tablero. */
@Component({
  selector: 'app-front-desk-stays',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslocoPipe],
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

  // Título y mensaje vacío de cada tabla: frontDesk.stays.<kind>.caption y .empty.
  get captionKey(): string {
    return `frontDesk.stays.${this.kind}.caption`;
  }

  get emptyMessageKey(): string {
    return `frontDesk.stays.${this.kind}.empty`;
  }

  nights(stay: FrontDeskStay): number {
    return stayNights(stay.checkInDate, stay.checkOutDate);
  }

  /** Llegada atrasada, salida de hoy o salida vencida. */
  dateTag(stay: FrontDeskStay): StayTag | undefined {
    if (this.kind === 'arrival') {
      return stay.checkInDate < this.today
        ? { labelKey: 'frontDesk.tags.lateArrival', css: 'chip--warning' }
        : undefined;
    }
    if (stay.checkOutDate < this.today) {
      return { labelKey: 'frontDesk.tags.overdueDeparture', css: 'chip--alert' };
    }
    return this.kind === 'in-house' && stay.checkOutDate === this.today
      ? { labelKey: 'frontDesk.tags.departsToday', css: 'chip--cleaning' }
      : undefined;
  }

  /** El check-in solo se ofrece con la habitación disponible; el backend repite la comprobación. */
  roomTag(stay: FrontDeskStay): StayTag {
    switch (stay.roomStatus) {
      case RoomStatus.AVAILABLE:
        return { labelKey: 'frontDesk.tags.roomReady', css: 'chip--ready' };
      case RoomStatus.CLEANING:
        return { labelKey: 'frontDesk.tags.beingCleaned', css: 'chip--cleaning' };
      case RoomStatus.MAINTENANCE:
        return { labelKey: 'frontDesk.tags.underMaintenance', css: 'chip--maintenance' };
      case RoomStatus.OCCUPIED:
        return { labelKey: 'frontDesk.tags.stillOccupied', css: 'chip--alert' };
      default:
        return { labelKey: 'frontDesk.tags.noRoom', css: 'chip--alert' };
    }
  }
}
