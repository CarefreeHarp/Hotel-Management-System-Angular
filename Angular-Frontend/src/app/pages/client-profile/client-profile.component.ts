import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY, Observable, Subject, catchError, concatMap, exhaustMap, finalize,
  forkJoin, of, switchMap, tap,
} from 'rxjs';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientInfoComponent } from '../../components/client-info/client-info.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { apiErrorMessage } from '../../utils/api-error';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage } from '../../utils/error-page';
import { ReservationCancelDialogComponent } from './components/reservation-cancel-dialog/reservation-cancel-dialog.component';

/** Carga el cliente indicado por auth y reutiliza el historial compartido para presentar sus reservas. */
@Component({
  selector: 'app-client-profile',
  imports: [
    SkeletonComponent,
    RouterLink,
    HeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    ClientInfoComponent,
    ReservationHistoryComponent,
    ReservationCancelDialogComponent,
  ],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.scss',
})
export class ClientProfileComponent implements OnInit {

  private readonly cancellationSubject = new Subject<number>();
  pendingCancellationId: number | undefined;
  isCancelling = false;
  cancellationError = '';

  private readonly actionSubject = new Subject<void>();
  private readonly clients = inject(ClientService);
  private readonly reservationsService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  client: ClientDetailDTO | undefined;
  reservations: ReservationDetails[] = [];
  isLoading = true;
  isDeleting = false;
  saved = false;
  errorMessage = '';

  constructor() {
    // Una confirmación en curso no debe iniciar otra escritura ni cancelarse por un segundo clic.
    this.cancellationSubject.pipe(
      exhaustMap((id) => this.performCancellation(id)),
      takeUntilDestroyed(),
    ).subscribe();
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap(() => this.performAction()),
      takeUntilDestroyed(),
    ).subscribe();
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap((params) => {
          const id = this.authParams.auth;
          this.pendingCancellationId = undefined;
          this.cancellationError = '';
          this.client = undefined;
          this.reservations = [];
          this.isLoading = true;
          this.saved = params.get('saved') === 'true';
          if (id === undefined) {
            void this.router.navigate(['/login'], { replaceUrl: true });
            return of(undefined);
          }
          // Si auth apunta a un cliente que no existe o falla el servidor, se muestra la pantalla de error.
          // forkJoin espera que terminen todas estas consultas y entrega sus resultados juntos.
          return forkJoin({
            client: this.clients.getById(id),
            reservations: this.reservationsService.history(id),
          }).pipe(catchErrorPage(this.router, this.route));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.client = data?.client;
        this.reservations = data?.reservations ?? [];
        this.isLoading = false;
      });
  }
  get pendingCancellation(): ReservationDetails | undefined {
    return this.reservations.find((detail) =>
      detail.reservation.reservationId === this.pendingCancellationId,
    );
  }

  requestCancellation(id: number): void {
    if (this.isCancelling || this.pendingCancellationId !== undefined) return;
    this.cancellationError = '';
    this.pendingCancellationId = id;
  }

  dismissCancellation(): void {
    if (this.isCancelling) return;
    this.pendingCancellationId = undefined;
    this.cancellationError = '';
  }

  confirmCancellation(): void {
    if (this.pendingCancellationId !== undefined && !this.isCancelling) {
      this.cancellationSubject.next(this.pendingCancellationId);
    }
  }

  /** Cancela y vuelve a leer el detalle para actualizar tarjeta y filtros con el estado persistido. */
  private performCancellation(id: number): Observable<unknown> {
    const clientId = this.authParams.auth;
    if (clientId === undefined) return EMPTY;
    this.isCancelling = true;
    this.cancellationError = '';
    return this.reservationsService.cancel(id).pipe(
      // La lectura espera la escritura. Un cambio de filtro no interrumpe la cancelación.
      concatMap(() => this.reservationsService.details(id)),
      tap((detail) => {
        // Una respuesta tardía no debe modificar el perfil de otro cliente tras cambiar auth.
        if (this.authParams.auth !== clientId) return;
        this.reservations = this.reservations.map((current) =>
          current.reservation.reservationId === id ? detail : current,
        );
        this.pendingCancellationId = undefined;
      }),
      catchError((error: HttpErrorResponse) => {
        if (this.authParams.auth === clientId) {
          this.cancellationError = apiErrorMessage(
            error,
            'Unable to cancel the reservation. Please try again.',
          );
        }
        return EMPTY;
      }),
      finalize(() => {
        this.isCancelling = false;
      }),
    );
  }

  deleteAccount(): void {
    this.actionSubject.next();
  }

  private performAction(): Observable<unknown> {
    if (
      !this.client ||
      this.isDeleting ||
      !confirm('Delete your Atlan Suites account? This cannot be undone.')
    )
      return EMPTY;
    this.isDeleting = true;
    this.errorMessage = '';
    return this.clients
      .delete(this.client.clientId)
      .pipe(
        tap(() => {
          void this.router.navigate(['/']);
        }),
        catchError((error: HttpErrorResponse) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Your account could not be deleted.',
          );
          this.isDeleting = false;

          return EMPTY;
        }),
      );
  }
}
