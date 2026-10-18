import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, input } from '@angular/core';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';

@Component({
  selector: 'app-client-info',
  imports: [OptimizedImageDirective],
  templateUrl: './client-info.component.html',
  styleUrl: './client-info.component.scss',
})
export class ClientInfoComponent {
  readonly client = input.required<ClientDetailDTO>();
  readonly staff = input(false);
}
