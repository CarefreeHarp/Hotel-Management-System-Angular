import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { clientQuery } from '../../utils/client-query';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { ServiceCatalogDTO } from '../../models/dto/service-catalog-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ButtonComponent } from '../../components/button/button.component';
import { basePath } from '../../utils/base-path';
import { catchErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-client-services-list',
  imports: [
    OptimizedImageDirective,
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
export class ClientServicesListComponent {
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly serviceService = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }

  private readonly selectedCategorySubject = new BehaviorSubject('ALL');
  private readonly searchQuerySubject = new BehaviorSubject('');
  // Si el catálogo no carga, la pantalla de error ofrece volver a intentarlo.
  private readonly catalog$ = this.serviceService.getCatalog().pipe(
    map((services) => ({ services, isLoading: false })),
    catchErrorPage(this.router, this.route),
    startWith({ services: new Array<ServiceCatalogDTO>(), isLoading: true }),
  );
  readonly state$ = combineLatest([
    this.catalog$,
    this.selectedCategorySubject,
    this.searchQuerySubject,
  ]).pipe(
    map(([state, selectedCategory, searchQuery]) => {
      const query = searchQuery.trim().toLowerCase();
      return {
        ...state,
        selectedCategory,
        searchQuery,
        categories: [
          ...new Set(
            state.services.map((item) => item.category).filter(Boolean),
          ),
        ].sort(),
        filteredServices: state.services.filter(
          (item) =>
            (selectedCategory === 'ALL' ||
              item.category === selectedCategory) &&
            (!query ||
              [item.name, item.summary, item.description, item.category].some(
                (value) => value?.toLowerCase().includes(query),
              )),
        ),
      };
    }),
  );
  selectCategory(category: string): void {
    this.selectedCategorySubject.next(category);
  }
  onSearchChange(value: string): void {
    this.searchQuerySubject.next(value);
  }

  formatPrice(price: number): string {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
