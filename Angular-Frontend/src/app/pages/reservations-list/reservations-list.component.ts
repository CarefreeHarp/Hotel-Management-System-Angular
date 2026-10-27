import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, LOCALE_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { BehaviorSubject, catchError, combineLatest, EMPTY, exhaustMap, map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCard,
  RecordCardsComponent,
} from '../../components/record-cards/record-cards.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ReservationDTO } from '../../models/dto/reservation-dto';
import { ReservationStatus } from '../../models/enums/reservation-status';
import { ReservationService } from '../../services/reservation.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { catchErrorPage } from '../../utils/error-page';
import {
  initialListState,
  ListFilter,
  ListState,
  matchesSearch,
} from '../../utils/list-state';
import { ReservationDeleteDialogComponent } from './components/reservation-delete-dialog/reservation-delete-dialog.component';
import { ReservationTableComponent } from './components/reservation-table/reservation-table.component';

@Component({
  selector: 'app-reservations-list',
  imports: [
    SkeletonComponent,
    AsyncPipe,
    AdminHeaderComponent,
    ListControlsComponent,
    RecordCardsComponent,
    ReservationTableComponent,
    ReservationDeleteDialogComponent,
    TranslocoPipe,
  ],
  templateUrl: './reservations-list.component.html',
  styleUrl: './reservations-list.component.scss',
})
export class ReservationsListComponent {

  private readonly actionSubject = new Subject<number>();
  private readonly service = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reloadSubject = new Subject<void>();
  // BehaviorSubject conserva el valor actual. next publica un cambio a quienes lo observan.
  private readonly listSubject = new BehaviorSubject(initialListState());
  // Formatea las fechas de las tarjetas con el idioma elegido (LOCALE_ID).
  private readonly dates = new DatePipe(inject(LOCALE_ID));
  message = '';
  actionError = '';
  deleting = false;
  pendingDeletionId: number | undefined;
  get base(): string {
    return basePath(this.route);
  }
  readonly sortOptions = [
    { value: 'id-asc', labelKey: 'list.sort.idAsc' },
    { value: 'id-desc', labelKey: 'list.sort.idDesc' },
    { value: 'guest-asc', labelKey: 'reservations.sort.guestAsc' },
    { value: 'guest-desc', labelKey: 'reservations.sort.guestDesc' },
    { value: 'checkIn-asc', labelKey: 'reservations.sort.checkInAsc' },
    { value: 'checkIn-desc', labelKey: 'reservations.sort.checkInDesc' },
    { value: 'created-asc', labelKey: 'reservations.sort.createdAsc' },
    { value: 'created-desc', labelKey: 'reservations.sort.createdDesc' },
  ];
  private readonly records$ = this.reloadSubject.pipe(
    startWith(undefined),
    // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
    switchMap(() =>
      this.service.getAll().pipe(
        map((items) => ({ items, loading: false })),
        // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
        catchErrorPage(this.router, this.route),
        startWith({ items: new Array<ReservationDTO>(), loading: true }),
      ),
    ),
  );
  // combineLatest recalcula la vista con los últimos datos y filtros, sin repetir la consulta HTTP.
  readonly state$ = combineLatest([this.records$, this.listSubject]).pipe(
    map(([data, controls]) => ({
      ...data,
      controls,
      filtered: this.filter(data.items, controls),
      filters: this.filters(data.items),
    })),
  );

  constructor() {
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap((id) => this.performAction(id)),
      takeUntilDestroyed(),
    ).subscribe();
  }
  changeControls(state: ListState): void {
    this.listSubject.next(state);
  }
  /** Abre la confirmación compartida por las vistas de tabla y tarjetas sin iniciar el borrado. */
  remove(id: number): void {
    if (this.deleting || this.pendingDeletionId !== undefined) {
      return;
    }
    this.pendingDeletionId = id;
  }

  cancelDeletion(): void {
    this.pendingDeletionId = undefined;
  }

  confirmDeletion(): void {
    const id = this.pendingDeletionId;
    if (id === undefined || this.deleting) {
      return;
    }
    this.pendingDeletionId = undefined;
    this.actionSubject.next(id);
  }

  private performAction(id: number): Observable<unknown> {
    if (this.deleting) {
      return EMPTY;
    }
    this.deleting = true;
    this.actionError = '';
    this.message = '';
    return this.service
      .delete(id)
      .pipe(
        tap(() => {
          this.deleting = false;
          this.message = translate('reservations.list.deleted');
          this.reload();
        }),
        catchError((error: HttpErrorResponse) => {
          this.deleting = false;
          this.actionError = apiErrorMessage(error, 'reservations.list.deleteError');

          return EMPTY;
        }),
      );
  }
  private reload(): void {
    this.reloadSubject.next();
  }
  private filters(items: ReservationDTO[]): ListFilter[] {
    const types = new Map<number, string>();
    for (const item of items) {
      if (item.roomTypeId !== undefined) {
        types.set(item.roomTypeId, item.roomTypeName ?? translate('common.unassigned'));
      }
    }
    return [
      {
        key: 'status',
        labelKey: 'common.fields.status',
        options: Object.values(ReservationStatus).map((value) => ({
          value,
          label: translate(`enums.reservationStatus.${value}`),
        })),
      },
      {
        key: 'roomType',
        labelKey: 'rooms.fields.roomType',
        options: [...types].map(([id, label]) => ({
          value: String(id),
          label,
        })),
      },
      { key: 'from', labelKey: 'reservations.fields.checkInFrom', type: 'date' },
      { key: 'to', labelKey: 'reservations.fields.checkInTo', type: 'date' },
      { key: 'guests', labelKey: 'reservations.fields.minGuests', type: 'number' },
    ];
  }
  private filter(items: ReservationDTO[], state: ListState): ReservationDTO[] {
    const filters = state.filters;
    return items
      .filter(
        (item) =>
          matchesSearch(state.search, [
            item.reservationId,
            item.reservationCode,
            item.clientId,
            item.clientName,
            item.roomNumber,
            item.roomTypeName,
          ]) &&
          (!filters['status'] || item.status === filters['status']) &&
          (!filters['roomType'] || String(item.roomTypeId) === filters['roomType']) &&
          (!filters['from'] || item.checkInDate >= filters['from']) &&
          (!filters['to'] || item.checkInDate <= filters['to']) &&
          (!filters['guests'] || item.guestCount >= Number(filters['guests'])),
      )
      .sort((a, b) => {
        const direction = state.sort.endsWith('-desc') ? -1 : 1;
        if (state.sort.startsWith('guest-')) {
          return (
            direction * (a.clientName ?? '').localeCompare(b.clientName ?? '')
          );
        }
        if (state.sort.startsWith('checkIn-')) {
          return direction * a.checkInDate.localeCompare(b.checkInDate);
        }
        if (state.sort.startsWith('created-')) {
          return (
            direction * (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
          );
        }
        return direction * (a.reservationId - b.reservationId);
      });
  }
  cards(items: ReservationDTO[]): RecordCard[] {
    return items.map((item) => ({
      id: item.reservationId,
      title: item.reservationCode,
      ...(item.roomTypeMainPhoto ? { image: item.roomTypeMainPhoto } : {}),
      details: [
        {
          labelKey: 'reservations.fields.guest',
          value: item.clientName?.trim() || translate('common.deletedGuest'),
        },
        {
          labelKey: 'reservations.fields.stay',
          value: `${this.dates.transform(item.checkInDate, 'MMM d, y')} – ${this.dates.transform(item.checkOutDate, 'MMM d, y')}`,
        },
        {
          labelKey: 'reservations.fields.room',
          value: `${item.roomTypeName ?? translate('common.unassigned')} · ${item.roomNumber ?? '—'}`,
        },
        { labelKey: 'reservations.fields.guests', value: String(item.guestCount) },
        {
          labelKey: 'common.fields.status',
          value: translate(`enums.reservationStatus.${item.status}`),
        },
      ],
      detailUrl: `${this.base}/reservations/${item.reservationId}`,
      editUrl: `${this.base}/reservations/${item.reservationId}/edit`,
      canDelete: true,
    }));
  }
}
