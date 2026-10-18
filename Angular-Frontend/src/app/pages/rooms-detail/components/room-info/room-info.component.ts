import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { RoomDetailDTO } from '../../../../models/dto/room-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-info',
  imports: [OptimizedImageDirective, DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './room-info.component.html',
  styleUrl: './room-info.component.scss',
})
export class RoomInfoComponent {
  @Input({ required: true }) room!: RoomDetailDTO;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
