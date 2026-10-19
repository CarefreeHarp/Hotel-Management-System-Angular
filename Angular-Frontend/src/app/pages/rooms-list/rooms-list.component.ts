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
import { RoomTableComponent } from './components/room-table/room-table.component';
import { RoomService } from '../../services/room.service';
import { RoomListDTO } from '../../models/dto/room-list-dto';
import {
  initialListState,
  matchesSearch,
  compareRecords,
  defaultSortOptions,
  ListFilter,
} from '../../utils/list-state';
import { basePath } from '../../utils/base-path';
import { apiErrorMessage } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
@Component({
  selector: 'app-rooms-list',
  imports: [
    SkeletonComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    ListControlsComponent,
    RecordCardsComponent,
    RoomTableComponent,
  ],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss',
})
export class RoomsListComponent {
  private readonly service = inject(RoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  items: RoomListDTO[] = [];
  listState = initialListState();
  readonly sortOptions = [
    ...defaultSortOptions,
    ...[
      { value: 'number-asc', label: 'Room: low to high' },
      { value: 'number-desc', label: 'Room: high to low' },
      { value: 'floor-asc', label: 'Floor: low to high' },
      { value: 'floor-desc', label: 'Floor: high to low' },
    ],
  ];
  loading = true;
  error = '';
  message = '';
  constructor() {
    this.load();
  }
  get filters(): ListFilter[] {
    return [
      {
        key: 'roomTypeName',
        label: 'Room type',
        options: [...new Set(this.items.map((item) => item.roomTypeName))]
          .sort()
          .map((value) => ({ value, label: value })),
      },
      {
        key: 'floor',
        label: 'Floor',
        options: [...new Set(this.items.map((item) => item.floor))]
          .sort((a, b) => a - b)
          .map((value) => ({ value: String(value), label: String(value) })),
      },
      {
        key: 'status',
        label: 'Physical status',
        options: [
          { value: 'AVAILABLE', label: 'Available' },
          { value: 'OCCUPIED', label: 'Occupied' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
        ],
      },
    ];
  }
  get filteredItems(): RoomListDTO[] {
    const f = this.listState.filters;
    return this.items
      .filter(
        (item) =>
          matchesSearch(this.listState.search, [item.roomId, item.number]) &&
          (!f['roomTypeName'] || item.roomTypeName === f['roomTypeName']) &&
          (!f['floor'] || String(item.floor) === f['floor']) &&
          (!f['status'] || item.status === f['status']),
      )
      .sort((a, b) => {
        const sort = this.listState.sort;
        const direction = sort.endsWith('-desc') ? -1 : 1;
        if (sort.startsWith('floor-')) return direction * (a.floor - b.floor);
        if (sort.startsWith('number-'))
          return direction * (a.number - b.number);
        return compareRecords(
          sort,
          a.roomId,
          b.roomId,
          'Room ' + a.number,
          'Room ' + b.number,
        );
      });
  }
  get activeItems(): RoomListDTO[] {
    return this.filteredItems.filter(
      (item) => item.activationStatus === 'ACTIVE',
    );
  }
  get inactiveItems(): RoomListDTO[] {
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
  private toCards(items: RoomListDTO[]): RecordCard[] {
    return items.map((item) => ({
      id: item.roomId,
      title: 'Room ' + item.number,
      image: item.mainPhoto,
      details: [
        { label: 'Type', value: item.roomTypeName },
        { label: 'Floor', value: String(item.floor) },
        { label: 'Physical status', value: item.status },
        { label: 'Activation', value: item.activationStatus },
      ],
      activationStatus: item.activationStatus,
      detailUrl: `${this.base}/rooms/${item.roomId}`,
      editUrl: `${this.base}/rooms/${item.roomId}/edit`,
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
    const item = this.items.find((item) => item.roomId === id);
    if (item) this.toggle(item);
  }
  toggle(item: RoomListDTO): void {
    this.error = '';
    this.message = '';
    const request =
      item.activationStatus === 'ACTIVE'
        ? this.service.deactivate(item.roomId)
        : this.service.activate(item.roomId);
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
