import { OptimizedImageDirective } from '../../../../../../directives/optimized-image.directive';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceCatalogDTO } from '../../../../../../models/dto/service-catalog-dto';
@Component({
  selector: 'app-service-card',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
})
export class ServiceCardComponent {
  @Input({ required: true }) service: ServiceCatalogDTO | undefined;
  @Input() auth: number | undefined;
}
