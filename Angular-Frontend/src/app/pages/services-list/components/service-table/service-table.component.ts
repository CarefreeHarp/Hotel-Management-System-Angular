import { CurrencyPipe } from '@angular/common';
import { Component, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { ServiceListDTO } from '../../../../models/dto/service-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-service-table',
  imports: [OptimizedImageDirective, CurrencyPipe, RouterLink, TranslocoPipe],
  templateUrl: './service-table.component.html',
  styleUrl: './service-table.component.scss',
})
export class ServiceTableComponent {
  @Input({ required: true }) services: ServiceListDTO[] = [];
  protected readonly toggleActivationSubject = new Subject<ServiceListDTO>();
  @Output('toggleActivation') readonly toggleActivation$ = this.toggleActivationSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
