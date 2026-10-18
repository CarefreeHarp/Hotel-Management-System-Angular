import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { clientQuery } from '../../../../utils/client-query';
import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { RoomTypeDetailDTO } from '../../../../models/dto/room-type-detail-dto';
import { basePath, isAdminArea } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-type-info',
  imports: [OptimizedImageDirective, DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './room-type-info.component.html',
  styleUrl: './room-type-info.component.scss',
})
export class RoomTypeInfoComponent {
  @Input({ required: true }) roomType!: RoomTypeDetailDTO;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
  readonly adminArea = isAdminArea(this.route);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
}
