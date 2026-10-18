import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { clientQuery } from '../../utils/client-query';
import { Component, OnInit, inject, signal } from '@angular/core';
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
export class ClientServicesDetailComponent implements OnInit {
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly route = inject(ActivatedRoute);
  private readonly serviceService = inject(ServiceService);
  get base(): string {
    return basePath(this.route);
  }

  readonly service = signal<ServiceDetailDTO | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idOrSlug = params.get('id');
      if (idOrSlug) {
        this.loadService(idOrSlug);
      }
    });
  }

  loadService(idOrSlug: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const numericId = Number(idOrSlug);
    if (!isNaN(numericId) && numericId > 0) {
      this.serviceService.getById(numericId).subscribe({
        next: (data) => {
          this.service.set(data.activationStatus === 'ACTIVE' ? data : null);
          if (data.activationStatus !== 'ACTIVE')
            this.errorMessage.set('The requested service is inactive.');
          this.isLoading.set(false);
        },
        error: () => {
          this.fallbackSearch(idOrSlug);
        },
      });
    } else {
      this.fallbackSearch(idOrSlug);
    }
  }

  // Se busca solo ese servicio por su urlName, sin descargar la lista completa.
  private fallbackSearch(slug: string): void {
    this.serviceService.getByUrlName(slug).subscribe({
      next: (found) => {
        this.service.set(found.activationStatus === 'ACTIVE' ? found : null);
        if (found.activationStatus !== 'ACTIVE')
          this.errorMessage.set('The requested service is inactive.');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('The requested service is not available.');
        this.isLoading.set(false);
      },
    });
  }

  formatPrice(price: number): string {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
