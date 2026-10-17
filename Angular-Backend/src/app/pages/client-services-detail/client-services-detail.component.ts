import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { AuthService } from '../../services/auth.service';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-client-services-detail',
  imports: [
    CommonModule,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    GalleryComponent,
  ],
  templateUrl: './client-services-detail.component.html',
  styleUrl: './client-services-detail.component.scss',
})
export class ClientServicesDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly serviceService = inject(ServiceService);
  protected readonly authService = inject(AuthService);
  readonly base = basePath(this.route);

  readonly service = signal<ServiceDetailDTO | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  readonly requestStatus = signal<'IDLE' | 'CONFIRMED'>('IDLE');
  readonly selectedSecondaryPhoto = signal<string | null>(null);

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
          this.service.set(data);
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
        this.service.set(found);
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

  handleBookService(): void {
    this.requestStatus.set('CONFIRMED');
  }

  dismissConfirmation(): void {
    this.requestStatus.set('IDLE');
  }

  openPhoto(photoUrl: string): void {
    this.selectedSecondaryPhoto.set(photoUrl);
  }

  closePhoto(): void {
    this.selectedSecondaryPhoto.set(null);
  }
}
