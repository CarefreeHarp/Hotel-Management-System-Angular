import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';

@Component({
  selector: 'app-client-info',
  imports: [OptimizedImageDirective, TranslocoPipe],
  templateUrl: './client-info.component.html',
  styleUrl: './client-info.component.scss',
})
export class ClientInfoComponent {
  @Input({ required: true }) client: ClientDetailDTO | undefined;
  @Input() staff = false;
}
