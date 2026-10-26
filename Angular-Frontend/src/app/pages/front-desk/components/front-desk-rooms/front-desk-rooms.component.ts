import { Component, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ROOM_STATUS_LABELS } from '../../../../models/enums/room-status';
import { FrontDeskRoom } from '../../../../models/front-desk';

/** Habitaciones en limpieza o mantenimiento. Las que esperan una llegada vienen primero desde el backend. */
@Component({
  selector: 'app-front-desk-rooms',
  templateUrl: './front-desk-rooms.component.html',
  styleUrl: './front-desk-rooms.component.scss',
})
export class FrontDeskRoomsComponent {
  @Input({ required: true }) rooms: FrontDeskRoom[] = [];
  @Input() busy = false;
  readonly statusLabels = ROOM_STATUS_LABELS;
  protected readonly markReadySubject = new Subject<FrontDeskRoom>();
  @Output('markReady') readonly markReady$ = this.markReadySubject.asObservable();
}
