import { DecimalPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { RoomDetailDTO } from '../../../../models/dto/room-detail-dto';
import { ROOM_STATUS_LABELS } from '../../../../models/enums/room-status';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-info',
  imports: [OptimizedImageDirective, DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './room-info.component.html',
  styleUrl: './room-info.component.scss',
})
export class RoomInfoComponent {
  @Input({ required: true }) room?: RoomDetailDTO;
  readonly statusLabels = ROOM_STATUS_LABELS;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
