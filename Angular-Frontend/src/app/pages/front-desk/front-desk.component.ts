import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import {
  catchError,
  EMPTY,
  exhaustMap,
  finalize,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { FrontDeskBoard, FrontDeskRoom, FrontDeskStay } from '../../models/front-desk';
import { FrontDeskService } from '../../services/front-desk.service';
import { OperatorService } from '../../services/operator.service';
import { ReservationService } from '../../services/reservation.service';
import { RoomService } from '../../services/room.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { FrontDeskRoomsComponent } from './components/front-desk-rooms/front-desk-rooms.component';
import { FrontDeskStaysComponent } from './components/front-desk-stays/front-desk-stays.component';

// Totales de las tarjetas superiores, calculados una vez por lectura.
interface DeskSummary {
  readyArrivals: number;
  guests: number;
  departuresWithBalance: number;
  cleaning: number;
  maintenance: number;
}

interface FrontDeskState {
  loading: boolean;
  board?: FrontDeskBoard;
  summary?: DeskSummary;
  error: string;
}

// id es la reserva en check-in y check-out, y la habitación en ready. label nombra el registro en el aviso.
interface DeskAction {
  kind: 'check-in' | 'check-out' | 'ready';
  id: number;
  label: string;
}

interface DeskNotice {
  title: string;
  message: string;
  error: boolean;
}

function summarize(board: FrontDeskBoard): DeskSummary {
  const cleaning = board.rooms.filter((room) => room.status === 'CLEANING').length;
  return {
    readyArrivals: board.arrivals.filter(
      (stay) => stay.status === 'CONFIRMED' && stay.roomStatus === 'AVAILABLE',
    ).length,
    guests: board.inHouse.reduce((total, stay) => total + stay.guestCount, 0),
    departuresWithBalance: board.departures.filter((stay) => stay.balance > 0).length,
    cleaning,
    maintenance: board.rooms.length - cleaning,
  };
}

/**
 * Inicio del operario. Lee el tablero del día y registra check-in, check-out y
 * habitaciones listas. Después de cada acción vuelve a leerlo: otro operario pudo
 * cambiar las mismas reservas o habitaciones.
 */
@Component({
  selector: 'app-front-desk',
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    AdminHeaderComponent,
    ButtonComponent,
    SkeletonComponent,
    FrontDeskStaysComponent,
    FrontDeskRoomsComponent,
    TranslocoPipe,
  ],
  templateUrl: './front-desk.component.html',
  styleUrl: './front-desk.component.scss',
})
export class FrontDeskComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly operators = inject(OperatorService);
  private readonly frontDesk = inject(FrontDeskService);
  private readonly reservations = inject(ReservationService);
  private readonly rooms = inject(RoomService);
  private readonly reloadSubject = new Subject<void>();
  private readonly actionSubject = new Subject<DeskAction>();
  private readonly toastSubject = new Subject<void>();
  private readonly dismissToastSubject = new Subject<void>();
  busy = false;
  notice: DeskNotice | null = null;
  get base(): string {
    return basePath(this.route);
  }

  // Igual que el panel del administrador: una id inválida o inexistente muestra la pantalla de error.
  readonly operator$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = Number(params.get('operatorId'));
      if (!Number.isSafeInteger(id) || id <= 0) {
        showErrorPage(this.router, this.route, 400);
        return EMPTY;
      }
      return this.operators.getById(id).pipe(catchErrorPage(this.router, this.route));
    }),
  );

  readonly state$: Observable<FrontDeskState> = this.reloadSubject.pipe(
    startWith(undefined),
    // switchMap descarta una lectura anterior. El tablero visible se conserva hasta que llega la nueva.
    switchMap(() =>
      this.frontDesk.getBoard().pipe(
        map((board) => ({ loading: false, board, summary: summarize(board), error: '' })),
        // El error queda dentro de la lectura: "Try again" y las acciones siguen funcionando.
        catchError(() =>
          of({ loading: false, error: translate('frontDesk.loadError') }),
        ),
      ),
    ),
    startWith({ loading: true, error: '' }),
  );

  constructor() {
    // exhaustMap ignora clics repetidos mientras termina la acción actual.
    this.actionSubject.pipe(
      exhaustMap((action) => this.perform(action)),
      takeUntilDestroyed(),
    ).subscribe();
    // Un aviso de éxito se cierra a los 4,5 segundos. Los errores esperan a que el operario los cierre.
    this.toastSubject.pipe(
      switchMap(() => timer(4500).pipe(takeUntil(this.dismissToastSubject))),
      takeUntilDestroyed(),
    ).subscribe(() => (this.notice = null));
  }

  checkIn(stay: FrontDeskStay): void {
    this.actionSubject.next({ kind: 'check-in', id: stay.reservationId, label: stay.reservationCode });
  }

  checkOut(stay: FrontDeskStay): void {
    this.actionSubject.next({ kind: 'check-out', id: stay.reservationId, label: stay.reservationCode });
  }

  markReady(room: FrontDeskRoom): void {
    this.actionSubject.next({
      kind: 'ready',
      id: room.roomId,
      label: translate('rooms.roomNumber', { number: room.number }),
    });
  }

  refresh(): void {
    this.reloadSubject.next();
  }

  dismissNotice(): void {
    this.notice = null;
    this.dismissToastSubject.next();
  }

  private perform(action: DeskAction): Observable<unknown> {
    this.busy = true;
    this.dismissNotice();
    let request: Observable<unknown>;
    let doneKey: string;
    switch (action.kind) {
      case 'check-in':
        request = this.reservations.checkIn(action.id);
        doneKey = 'frontDesk.notice.checkedIn';
        break;
      case 'check-out':
        request = this.reservations.checkOut(action.id);
        doneKey = 'frontDesk.notice.checkedOut';
        break;
      case 'ready':
        request = this.rooms.markReady(action.id);
        doneKey = 'frontDesk.notice.ready';
        break;
    }
    return request.pipe(
      tap(() => {
        this.notice = {
          title: translate('frontDesk.notice.updated'),
          message: translate(doneKey, { label: action.label }),
          error: false,
        };
        this.toastSubject.next();
      }),
      catchError((error: unknown) => {
        this.notice = {
          title: translate('frontDesk.notice.failed'),
          message: apiErrorMessage(error, 'frontDesk.notice.error'),
          error: true,
        };
        return EMPTY;
      }),
      // Con éxito o error se vuelve a leer el tablero para mostrar el estado actual.
      finalize(() => {
        this.busy = false;
        this.reloadSubject.next();
      }),
    );
  }
}
