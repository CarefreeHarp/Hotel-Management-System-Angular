import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomListDTO } from '../../../../models/dto/room-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-table',
  imports: [RouterLink],
  templateUrl: './room-table.component.html',
  styleUrl: './room-table.component.scss',
})
export class RoomTableComponent {
  @Input({ required: true }) rooms: RoomListDTO[] = [];
  // La misma tabla sirve para las dos secciones: en la de inactivas cambian los botones.
  @Input() inactive = false;
  @Output() delete = new EventEmitter<RoomListDTO>();
  @Output() deactivate = new EventEmitter<RoomListDTO>();
  @Output() activate = new EventEmitter<RoomListDTO>();
  readonly base = basePath(inject(ActivatedRoute));
}
