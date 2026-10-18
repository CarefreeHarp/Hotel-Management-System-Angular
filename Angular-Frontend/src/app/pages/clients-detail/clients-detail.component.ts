import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, forkJoin, of, switchMap } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientService } from '../../services/client.service';
import { ClientInfoComponent } from '../../components/client-info/client-info.component';
import { ReservationDetails } from '../../models/booking';
import { ReservationService } from '../../services/reservation.service';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-clients-detail',
  imports: [
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
        switchMap(([params, query]) => {
          const id = Number(params.get('id'));
          this.saved = query.get('saved') === 'true';
          this.client = undefined;
          this.reservations = [];
          this.historyError = '';
          this.isLoading = true;
          this.historyLoading = true;
          if (!Number.isSafeInteger(id) || id <= 0) return of(undefined);
          return forkJoin({
            client: this.service.getById(id),
            reservations: this.reservationsService.history(id).pipe(
              catchError(() => {
                this.historyError = 'Reservation history could not be loaded.';
                return of(new Array<ReservationDetails>());
              }),
            ),
          }).pipe(catchError(() => of(undefined)));
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
