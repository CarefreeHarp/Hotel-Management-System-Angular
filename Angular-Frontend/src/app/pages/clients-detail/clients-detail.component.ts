import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  catchError,
  combineLatest,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientInfoComponent } from '../../components/client-info/client-info.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';

/** Carga el perfil del cliente y su historial para el personal del hotel. */
@Component({
  selector: 'app-clients-detail',
  imports: [
    SkeletonComponent,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    ClientInfoComponent,
    ReservationHistoryComponent,
  ],
  templateUrl: './clients-detail.component.html',
  styleUrl: './clients-detail.component.scss',
})
export class ClientsDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  private readonly reservationsService = inject(ReservationService);
  reservations: ReservationDetails[] = [];
  historyError = '';
  historyLoading = true;
  client: ClientDetailDTO | undefined;
  isLoading = true;
  saved = false;

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap(([params, query]) => {
          const id = Number(params.get('id'));
          this.saved = query.get('saved') === 'true';
          this.client = undefined;
          this.reservations = [];
          this.historyError = '';
          this.isLoading = true;
          this.historyLoading = true;
          // Una id inválida muestra la pantalla 400. Si el cliente no carga, la que corresponda.
          if (!Number.isSafeInteger(id) || id <= 0) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          // forkJoin espera que terminen todas estas consultas y entrega sus resultados juntos.
          return forkJoin({
            client: this.service.getById(id),
            // El historial es secundario: si falla, se avisa en la página y el cliente se muestra igual.
            reservations: this.reservationsService.history(id).pipe(
              catchError(() => {
                this.historyError = 'Reservation history could not be loaded.';
                return of(new Array<ReservationDetails>());
              }),
            ),
          }).pipe(catchErrorPage(this.router, this.route));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.client = data?.client;
        this.reservations = data?.reservations ?? [];
        this.isLoading = false;
        this.historyLoading = false;
      });
  }
}
