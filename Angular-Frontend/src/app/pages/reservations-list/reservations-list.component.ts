import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCardsComponent,
  RecordCard,
} from '../../components/record-cards/record-cards.component';
import { ReservationDTO } from '../../models/dto/reservation-dto';
import { ReservationStatus } from '../../models/enums/reservation-status';
import { ReservationService } from '../../services/reservation.service';
import { basePath } from '../../utils/base-path';
import {
  initialListState,
  ListFilter,
  ListState,
  matchesSearch,
} from '../../utils/list-state';
import { ReservationTableComponent } from './components/reservation-table/reservation-table.component';
import { apiErrorMessage } from '../../utils/api-error';
import { catchErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-reservations-list',
  imports: [
    AsyncPipe,
    AdminHeaderComponent,
    ListControlsComponent,
    RecordCardsComponent,
    ReservationTableComponent,
  ],
  templateUrl: './reservations-list.component.html',
  styleUrl: './reservations-list.component.scss',
})
export class ReservationsListComponent {
  private readonly service = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadSubject = new Subject<void>();
  private readonly listSubject = new BehaviorSubject(initialListState());
  private readonly dates = new DatePipe('en-US');
  message = '';
  actionError = '';
  deleting = false;
  get base(): string {
    return basePath(this.route);
  }
  readonly sortOptions = [
    { value: 'id-asc', label: 'ID: low to high' },
    { value: 'id-desc', label: 'ID: high to low' },
    { value: 'guest-asc', label: 'Guest: A–Z' },
    { value: 'guest-desc', label: 'Guest: Z–A' },
    { value: 'checkIn-asc', label: 'Check-in: earliest first' },
    { value: 'checkIn-desc', label: 'Check-in: latest first' },
    { value: 'created-asc', label: 'Booking date: earliest first' },
    { value: 'created-desc', label: 'Booking date: latest first' },
  ];
  private readonly records$ = this.reloadSubject.pipe(
    startWith(undefined),
    switchMap(() =>
      this.service.getAll().pipe(
        map((items) => ({ items, loading: false })),
        // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
        catchErrorPage(this.router, this.route),
        startWith({ items: new Array<ReservationDTO>(), loading: true }),
      ),
    ),
  );
  readonly state$ = combineLatest([this.records$, this.listSubject]).pipe(
    map(([data, controls]) => ({
      ...data,
      controls,
      filtered: this.filter(data.items, controls),
      filters: this.filters(data.items),
    })),
  );
  changeControls(state: ListState): void {
    this.listSubject.next(state);
  }
  remove(id: number): void {
    if (
      this.deleting ||
      !window.confirm(
        'Permanent deletion is only for special cases. In normal cases, changing the status to CANCELLED may be sufficient. This will delete the reservation, its folio, charges and payments. This action is irreversible. Continue?',
      )
    )
      return;
    this.deleting = true;
    this.actionError = '';
    this.message = '';
    this.service
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.message = 'Reservation permanently deleted.';
          this.reload();
        },
        error: (error: HttpErrorResponse) => {
          this.deleting = false;
          this.actionError = apiErrorMessage(
            error,
            'Unable to delete the reservation. Please try again.',
          );
        },
      });
  }
  private reload(): void {
    this.reloadSubject.next();
  }
  private filters(items: ReservationDTO[]): ListFilter[] {
    const types = new Map<number, string>();
    for (const item of items)
      if (item.roomTypeId !== undefined)
        types.set(item.roomTypeId, item.roomTypeName ?? 'Unassigned');
    return [
      {
        key: 'status',
        label: 'Status',
        options: Object.values(ReservationStatus).map((value) => ({
          value,
          label: value.replace('_', ' ').toLowerCase(),
        })),
      },
      {
        key: 'roomType',
        label: 'Room type',
        options: [...types].map(([id, label]) => ({
          value: String(id),
          label,
        })),
      },
      { key: 'from', label: 'Check-in from', type: 'date' },
      { key: 'to', label: 'Check-in to', type: 'date' },
      { key: 'guests', label: 'Minimum guests', type: 'number' },
    ];
  }
  private filter(items: ReservationDTO[], state: ListState): ReservationDTO[] {
    const f = state.filters;
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
          (!f['status'] || item.status === f['status']) &&
          (!f['roomType'] || String(item.roomTypeId) === f['roomType']) &&
          (!f['from'] || item.checkInDate >= f['from']) &&
          (!f['to'] || item.checkInDate <= f['to']) &&
          (!f['guests'] || item.guestCount >= Number(f['guests'])),
      )
      .sort((a, b) => {
        const direction = state.sort.endsWith('-desc') ? -1 : 1;
        if (state.sort.startsWith('guest-'))
          return (
            direction * (a.clientName ?? '').localeCompare(b.clientName ?? '')
          );
        if (state.sort.startsWith('checkIn-'))
          return direction * a.checkInDate.localeCompare(b.checkInDate);
        if (state.sort.startsWith('created-'))
          return (
            direction * (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
          );
        return direction * (a.reservationId - b.reservationId);
      });
  }
  cards(items: ReservationDTO[]): RecordCard[] {
    return items.map((item) => ({
      id: item.reservationId,
      title: item.reservationCode,
      ...(item.roomTypeMainPhoto ? { image: item.roomTypeMainPhoto } : {}),
      details: [
        { label: 'Guest', value: item.clientName?.trim() || 'Deleted guest' },
        {
          label: 'Stay',
          value: `${this.dates.transform(item.checkInDate, 'MMM d, y')} – ${this.dates.transform(item.checkOutDate, 'MMM d, y')}`,
        },
        {
          label: 'Room',
          value: `${item.roomTypeName ?? 'Unassigned'} · ${item.roomNumber ?? '—'}`,
        },
        { label: 'Guests', value: String(item.guestCount) },
        { label: 'Status', value: item.status.replace('_', ' ').toLowerCase() },
      ],
      detailUrl: `${this.base}/reservations/${item.reservationId}`,
      editUrl: `${this.base}/reservations/${item.reservationId}/edit`,
      canDelete: true,
    }));
  }
}
