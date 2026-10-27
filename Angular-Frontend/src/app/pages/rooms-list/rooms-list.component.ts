import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { catchError, EMPTY, exhaustMap, Observable, Subject, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCard,
  RecordCardsComponent,
} from '../../components/record-cards/record-cards.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomListDTO } from '../../models/dto/room-list-dto';
import { RoomStatus } from '../../models/enums/room-status';
import { RoomService } from '../../services/room.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  compareRecords,
  defaultSortOptions,
  initialListState,
  ListFilter,
  matchesSearch,
} from '../../utils/list-state';
import { RoomTableComponent } from './components/room-table/room-table.component';
/** Coordina la lista de habitaciones, sus filtros y acciones. Los componentes hijos presentan los registros. */
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
    TranslocoPipe,
  ],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss',
})
export class RoomsListComponent {
  private readonly actionSubject = new Subject<RoomListDTO>();
  private readonly loadSubject = new Subject<void>();
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
      { value: 'number-asc', labelKey: 'rooms.sort.numberAsc' },
      { value: 'number-desc', labelKey: 'rooms.sort.numberDesc' },
      { value: 'floor-asc', labelKey: 'rooms.sort.floorAsc' },
      { value: 'floor-desc', labelKey: 'rooms.sort.floorDesc' },
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
  get filters(): ListFilter[] {
    return [
      {
        key: 'roomTypeName',
        labelKey: 'rooms.fields.roomType',
        options: [...new Set(this.items.map((item) => item.roomTypeName))]
          .sort()
          .map((value) => ({ value, label: value })),
      },
      {
        key: 'floor',
        labelKey: 'rooms.fields.floor',
        options: [...new Set(this.items.map((item) => item.floor))]
          .sort((a, b) => a - b)
          .map((value) => ({ value: String(value), label: String(value) })),
      },
      {
        key: 'status',
        labelKey: 'rooms.fields.physicalStatus',
        options: Object.values(RoomStatus).map((value) => ({
          value,
          label: translate(`enums.roomStatus.${value}`),
        })),
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
        if (sort.startsWith('floor-')) {
          return direction * (a.floor - b.floor);
        }
        if (sort.startsWith('number-')) {
          return direction * (a.number - b.number);
        }
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
      title: translate('rooms.roomNumber', { number: item.number }),
      image: item.mainPhoto,
      details: [
        { labelKey: 'rooms.fields.type', value: item.roomTypeName },
        { labelKey: 'rooms.fields.floor', value: String(item.floor) },
        { labelKey: 'rooms.fields.physicalStatus', value: translate(`enums.roomStatus.${item.status}`) },
        { labelKey: 'common.fields.activation', value: translate(`enums.activationStatus.${item.activationStatus}`) },
      ],
      activationStatus: item.activationStatus,
      detailUrl: `${this.base}/rooms/${item.roomId}`,
      editUrl: `${this.base}/rooms/${item.roomId}/edit`,
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
    const item = this.items.find((item) => item.roomId === id);
    if (item) {
      this.toggle(item);
    }
  }
  toggle(item: RoomListDTO): void {
    this.actionSubject.next(item);
  }

  private performAction(item: RoomListDTO): Observable<unknown> {
    this.error = '';
    this.message = '';
    const request =
      item.activationStatus === 'ACTIVE'
        ? this.service.deactivate(item.roomId)
        : this.service.activate(item.roomId);
    return request.pipe(
      tap(() => {
        this.message = translate('common.activation.updated');
        this.load();
      }),
      catchError((error: HttpErrorResponse) => {
        (this.error = apiErrorMessage(error, 'common.activation.error')); return EMPTY;
      }),
    );
  }
}
