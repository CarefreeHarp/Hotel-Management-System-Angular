import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { ButtonComponent } from '../../components/button/button.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ServiceCatalogDTO } from '../../models/dto/service-catalog-dto';
import { ServiceService } from '../../services/service.service';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage } from '../../utils/error-page';

/** Carga el catálogo una vez y calcula la búsqueda y las categorías en la vista. */
@Component({
  selector: 'app-client-services-list',
  imports: [
    SkeletonComponent,
    OptimizedImageDirective,
    CommonModule,
    RouterLink,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    ButtonComponent,
    TranslocoPipe,
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

  // BehaviorSubject conserva el valor actual. next publica un cambio a quienes lo observan.
  private readonly selectedCategorySubject = new BehaviorSubject('ALL');
  private readonly searchQuerySubject = new BehaviorSubject('');
  // Si el catálogo no carga, la pantalla de error ofrece volver a intentarlo.
  private readonly catalog$ = this.serviceService.getCatalog().pipe(
    map((services) => ({ services, isLoading: false })),
    catchErrorPage(this.router, this.route),
    startWith({ services: new Array<ServiceCatalogDTO>(), isLoading: true }),
  );
  // combineLatest recalcula la vista con los últimos datos y filtros, sin repetir la consulta HTTP.
  readonly state$ = combineLatest([
    this.catalog$,
    this.selectedCategorySubject,
    this.searchQuerySubject,
  ]).pipe(
    map(([state, selectedCategory, searchQuery]) => {
      const query = searchQuery.trim().toLowerCase();
      const categories: string[] = [];
      for (const service of state.services) {
        if (service.category && !categories.includes(service.category)) {
          categories.push(service.category);
        }
      }
      categories.sort();
      return {
        ...state,
        selectedCategory,
        searchQuery,
        categories,
        filteredServices: this.filterServices(state.services, selectedCategory, query),
      };
    }),
  );
  private filterServices(services: ServiceCatalogDTO[], category: string, query: string): ServiceCatalogDTO[] {
    const result: ServiceCatalogDTO[] = [];
    for (const service of services) {
      if (category !== 'ALL' && service.category !== category) {
        continue;
      }
      const values = [service.name, service.summary, service.description, service.category];
      let matches = !query;
      for (const value of values) {
        if (value?.toLowerCase().includes(query)) {
          matches = true;
        }
      }
      if (matches) {
        result.push(service);
      }
    }
    return result;
  }

  selectCategory(category: string): void {
    this.selectedCategorySubject.next(category);
  }
  onSearchChange(value: string): void {
    this.searchQuerySubject.next(value);
  }
}
