import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, EMPTY, map, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ReservationContentComponent } from '../../components/reservation-content/reservation-content.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';

/** Carga reserva y huésped. El componente de finanzas presenta los cargos y pagos recibidos. */
@Component({
  selector: 'app-reservation-detail',
  imports: [
    SkeletonComponent,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    ButtonComponent,
    ReservationContentComponent,
  ],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.scss',
})
export class ReservationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservations = inject(ReservationService);
  private readonly clients = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);
  detail: ReservationDetails | undefined;
  client: ClientDetailDTO | undefined;
  isLoading = true;
  get saved(): boolean {
    return this.route.snapshot.queryParamMap.get('saved') === 'true';
  }
  get staff(): boolean {
    return (
      this.route.snapshot.paramMap.has('adminId') ||
      this.route.snapshot.paramMap.has('operatorId')
    );
  }
  get staffViewTitle(): string {
    if (this.route.snapshot.paramMap.has('adminId')) return 'Admin view';
    if (this.route.snapshot.paramMap.has('operatorId')) return 'Operator view';
    return '';
  }
  get clientHistoryId(): number | undefined {
    const id = Number(this.route.snapshot.queryParamMap.get('clientId'));
    return this.staff && Number.isSafeInteger(id) && id > 0 ? id : undefined;
  }
  get backUrl(): string {
    if (this.clientHistoryId !== undefined)
      return `${basePath(this.route)}/clients/${this.clientHistoryId}`;
    return this.staff ? `${basePath(this.route)}/reservations` : '/profile';
  }
  get editUrl(): string {
    return `${basePath(this.route)}/reservations/${this.detail?.reservation.reservationId}/edit`;
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap(([params]) => {
          this.detail = undefined;
          this.client = undefined;
          this.isLoading = true;
          const id = Number(params.get('id'));
          // Una id inválida muestra la pantalla 400. Si la reserva no carga, la que corresponda.
          if (!Number.isSafeInteger(id) || id <= 0) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          return this.reservations.details(id).pipe(
            switchMap((detail) => {
              if (detail.clientId === undefined) {
                return of({ detail, client: undefined });
              }
              return this.clients.getById(detail.clientId).pipe(
                map((client) => ({ detail, client })),
                // El huésped es información secundaria. Su ausencia no impide mostrar la reserva.
                catchError(() => of({ detail, client: undefined })),
              );
            }),
            catchErrorPage(this.router, this.route),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.detail = data?.detail;
        this.client = data?.client;
        this.isLoading = false;
      });
  }
}
