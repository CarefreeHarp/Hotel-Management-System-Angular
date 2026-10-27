import { CurrencyPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../components/button/button.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { RoomDetailDTO } from '../../../../models/dto/room-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-info',
  imports: [OptimizedImageDirective, CurrencyPipe, RouterLink, ButtonComponent, TranslocoPipe],
  templateUrl: './room-info.component.html',
  styleUrl: './room-info.component.scss',
})
export class RoomInfoComponent {
  @Input({ required: true }) room?: RoomDetailDTO;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
