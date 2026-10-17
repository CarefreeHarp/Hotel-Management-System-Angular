import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { AuthService } from '../../services/auth.service';
import { ServiceCatalogDTO } from '../../models/dto/service-catalog-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../components/button/button.component';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-client-services-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
  ],
  templateUrl: './client-services-list.component.html',
  styleUrl: './client-services-list.component.scss',
})
export class ClientServicesListComponent implements OnInit {
  private readonly serviceService = inject(ServiceService);
  protected readonly authService = inject(AuthService);
  // / en el sitio público o /client/:clientId cuando el cliente tiene sesión.
  readonly base = basePath(inject(ActivatedRoute));

  readonly services = signal<ServiceCatalogDTO[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  readonly selectedCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  readonly categories = computed(() => {
    const all = this.services();
    const set = new Set<string>();
    for (const item of all) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).sort();
  });

  readonly filteredServices = computed(() => {
    const list = this.services();
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    // El backend ya envía solo los servicios activos del catálogo.
    return list.filter((item) => {
      const matchesCat = cat === 'ALL' || item.category === cat;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.summary && item.summary.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      return matchesCat && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.serviceService.getCatalog().subscribe({
      next: (data) => {
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'The service catalog could not be loaded. Please try again.',
        );
        this.isLoading.set(false);
      },
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  formatPrice(price: number): string {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
