import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomListDTO } from '../../../../models/dto/room-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-table',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './room-table.component.html',
  styleUrl: './room-table.component.scss',
})
export class RoomTableComponent {
  @Input({ required: true }) rooms: RoomListDTO[] = [];
  @Output() toggleActivation = new EventEmitter<RoomListDTO>();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
