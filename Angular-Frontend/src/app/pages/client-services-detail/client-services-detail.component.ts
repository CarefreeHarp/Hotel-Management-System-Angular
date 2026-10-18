import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { clientQuery } from '../../utils/client-query';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ServiceGalleryComponent } from './components/service-gallery/service-gallery.component';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-client-services-detail',
  imports: [
    OptimizedImageDirective,
    CommonModule,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    ServiceGalleryComponent,
  ],
  templateUrl: './client-services-detail.component.html',
  styleUrl: './client-services-detail.component.scss',
})
export class ClientServicesDetailComponent {
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly route = inject(ActivatedRoute);
  private readonly serviceService = inject(ServiceService);
  get base(): string {
    return basePath(this.route);
  }

  readonly state$: Observable<{
    service?: ServiceDetailDTO;
    isLoading: boolean;
    errorMessage: string;
  }> = this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((idOrSlug) => {
      const numericId = Number(idOrSlug);
      const request =
        Number.isSafeInteger(numericId) && numericId > 0
          ? this.serviceService
              .getById(numericId)
              .pipe(
                catchError(() => this.serviceService.getByUrlName(idOrSlug)),
              )
          : this.serviceService.getByUrlName(idOrSlug);
      return request.pipe(
        map(
          (
            service,
          ): {
            service?: ServiceDetailDTO;
            isLoading: boolean;
            errorMessage: string;
          } =>
            service.activationStatus === 'ACTIVE'
              ? { service, isLoading: false, errorMessage: '' }
              : {
                  isLoading: false,
                  errorMessage: 'The requested service is inactive.',
                },
        ),
        catchError(() =>
          of({
            isLoading: false,
            errorMessage: 'The requested service is not available.',
          }),
        ),
        startWith({ isLoading: true, errorMessage: '' }),
      );
    }),
  );

  formatPrice(price: number): string {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
