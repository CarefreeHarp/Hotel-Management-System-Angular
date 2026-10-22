import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, exhaustMap, Observable, Subject, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCard,
  RecordCardsComponent,
} from '../../components/record-cards/record-cards.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ServiceListDTO } from '../../models/dto/service-list-dto';
import { ServiceService } from '../../services/service.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  compareRecords,
  defaultSortOptions,
  initialListState,
  ListFilter,
  matchesSearch,
  priceMatches,
} from '../../utils/list-state';
import { ServiceTableComponent } from './components/service-table/service-table.component';
/** Coordina la lista de servicios, sus filtros y acciones. Los componentes hijos presentan los registros. */
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
  private readonly actionSubject = new Subject<ServiceListDTO>();
  private readonly loadSubject = new Subject<void>();
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
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap((item) => this.performAction(item)),
      takeUntilDestroyed(),
    ).subscribe();
    // Una recarga sustituye la lectura anterior. Las escrituras usan un flujo independiente.
    this.loadSubject.pipe(
      switchMap(() => this.loadRecords()),
      takeUntilDestroyed(),
    ).subscribe();

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
    this.loadSubject.next();
  }

  private loadRecords(): Observable<unknown> {
    this.loading = true;
    return this.service.getAll().pipe(
      tap((items) => {
        this.items = items;
        this.loading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }
  toggleById(id: number): void {
    const item = this.items.find((item) => item.serviceId === id);
    if (item) this.toggle(item);
  }
  toggle(item: ServiceListDTO): void {
    this.actionSubject.next(item);
  }

  private performAction(item: ServiceListDTO): Observable<unknown> {
    this.error = '';
    this.message = '';
    const request =
      item.activationStatus === 'ACTIVE'
        ? this.service.deactivate(item.serviceId)
        : this.service.activate(item.serviceId);
    return request.pipe(
      tap(() => {
        this.message = 'Activation status updated.';
        this.load();
      }),
      catchError((error: HttpErrorResponse) => {
        (this.error = apiErrorMessage(
          error,
          'The activation status could not be changed.',
        )); return EMPTY;
      }),
    );
  }
}
