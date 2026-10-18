import {
  Observable,
  catchError,
  filter,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { clientQuery } from '../../utils/client-query';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ServiceGalleryComponent } from './components/service-gallery/service-gallery.component';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';

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
  private readonly router = inject(Router);
  private readonly serviceService = inject(ServiceService);
  get base(): string {
    return basePath(this.route);
  }

  // Si el servicio no existe o falla la carga, se muestra la pantalla de error que corresponda.
  readonly state$: Observable<{
    service?: ServiceDetailDTO;
    isLoading: boolean;
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
        // Un servicio inactivo no está en el catálogo: para el huésped no existe.
        tap((service) => {
          if (service.activationStatus !== 'ACTIVE')
            showErrorPage(this.router, this.route, 404);
        }),
        filter((service) => service.activationStatus === 'ACTIVE'),
        map((service) => ({ service, isLoading: false })),
        catchErrorPage(this.router, this.route),
        startWith({ isLoading: true }),
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
