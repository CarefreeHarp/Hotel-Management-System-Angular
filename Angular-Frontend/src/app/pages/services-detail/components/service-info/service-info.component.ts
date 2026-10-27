import { CurrencyPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../components/button/button.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { ServiceDetailDTO } from '../../../../models/dto/service-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-service-info',
  imports: [OptimizedImageDirective, CurrencyPipe, RouterLink, ButtonComponent, TranslocoPipe],
  templateUrl: './service-info.component.html',
  styleUrl: './service-info.component.scss',
})
export class ServiceInfoComponent {
  @Input({ required: true }) service?: ServiceDetailDTO;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
