import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCardsComponent,
  RecordCard,
} from '../../components/record-cards/record-cards.component';
import { ServiceTableComponent } from './components/service-table/service-table.component';
import { ServiceService } from '../../services/service.service';
import { ServiceListDTO } from '../../models/dto/service-list-dto';
import {
  initialListState,
  matchesSearch,
  compareRecords,
  defaultSortOptions,
  ListFilter,
  priceMatches,
} from '../../utils/list-state';
import { basePath } from '../../utils/base-path';
import { apiErrorMessage } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
@Component({
  selector: 'app-services-list',
  imports: [
    SkeletonComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    ListControlsComponent,
    RecordCardsComponent,
    ServiceTableComponent,
  ],
  templateUrl: './services-list.component.html',
  styleUrl: './services-list.component.scss',
})
export class ServicesListComponent {
  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  items: ServiceListDTO[] = [];
  listState = initialListState();
  readonly sortOptions = [
    ...defaultSortOptions,
    ...[
      { value: 'price-asc', label: 'Price: low to high' },
      { value: 'price-desc', label: 'Price: high to low' },
    ],
  ];
  loading = true;
  error = '';
  message = '';
  constructor() {
    this.load();
  }
  get priceFloor(): number {
    return this.items.length
      ? Math.min(...this.items.map((item) => item.price))
      : 0;
  }
  get priceLimit(): number {
    return this.items.length
      ? Math.max(...this.items.map((item) => item.price))
      : 0;
  }
  get filters(): ListFilter[] {
    return [
      {
        key: 'category',
        label: 'Category',
        options: [...new Set(this.items.map((item) => item.category))]
          .sort()
          .map((value) => ({ value, label: value })),
      },
    ];
  }
  get filteredItems(): ServiceListDTO[] {
    const f = this.listState.filters;
    return this.items
      .filter(
        (item) =>
          matchesSearch(this.listState.search, [
            item.serviceId,
            item.name,
            item.summary,
          ]) &&
          (!f['category'] || item.category === f['category']) &&
          priceMatches(item.price, this.listState),
      )
      .sort((a, b) => {
        const sort = this.listState.sort;
        const direction = sort.endsWith('-desc') ? -1 : 1;
        if (sort.startsWith('price-')) return direction * (a.price - b.price);
        return compareRecords(sort, a.serviceId, b.serviceId, a.name, b.name);
      });
  }
  get activeItems(): ServiceListDTO[] {
    return this.filteredItems.filter(
      (item) => item.activationStatus === 'ACTIVE',
    );
  }
  get inactiveItems(): ServiceListDTO[] {
    return this.filteredItems.filter(
      (item) => item.activationStatus === 'INACTIVE',
    );
  }
  get cards(): RecordCard[] {
    return this.toCards(this.activeItems);
  }
  get inactiveCards(): RecordCard[] {
    return this.toCards(this.inactiveItems);
  }
  private toCards(items: ServiceListDTO[]): RecordCard[] {
    return items.map((item) => ({
      id: item.serviceId,
      title: item.name,
      image: item.mainImageUrl,
      details: [
        { label: 'Category', value: item.category },
        { label: 'Price', value: 'COP ' + item.price.toLocaleString('en-US') },
        { label: 'Activation', value: item.activationStatus },
      ],
      activationStatus: item.activationStatus,
      detailUrl: `${this.base}/services/${item.serviceId}`,
      editUrl: `${this.base}/services/${item.serviceId}/edit`,
    }));
  }
  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }
  toggleById(id: number): void {
    const item = this.items.find((item) => item.serviceId === id);
    if (item) this.toggle(item);
  }
  toggle(item: ServiceListDTO): void {
    this.error = '';
    this.message = '';
    const request =
      item.activationStatus === 'ACTIVE'
        ? this.service.deactivate(item.serviceId)
        : this.service.activate(item.serviceId);
    request.subscribe({
      next: () => {
        this.message = 'Activation status updated.';
        this.load();
      },
      error: (error: HttpErrorResponse) =>
        (this.error = apiErrorMessage(
          error,
          'The activation status could not be changed.',
        )),
    });
  }
}
