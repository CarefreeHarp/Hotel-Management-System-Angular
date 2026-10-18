import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceListDTO } from '../../../../models/dto/service-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-service-table',
  imports: [OptimizedImageDirective, DecimalPipe, RouterLink],
  templateUrl: './service-table.component.html',
  styleUrl: './service-table.component.scss',
})
export class ServiceTableComponent {
  @Input({ required: true }) services: ServiceListDTO[] = [];
  @Output() toggleActivation = new EventEmitter<ServiceListDTO>();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
