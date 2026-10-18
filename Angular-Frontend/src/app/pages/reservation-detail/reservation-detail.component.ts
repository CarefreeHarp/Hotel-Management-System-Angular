import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { basePath } from '../../utils/base-path';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientInfoComponent } from '../../components/client-info/client-info.component';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ReservationService } from '../../services/reservation.service';
import { ClientService } from '../../services/client.service';
import { clientQuery } from '../../utils/client-query';
import { ReservationFinanceComponent } from './components/reservation-finance/reservation-finance.component';

@Component({
  selector: 'app-reservation-detail',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    ButtonComponent,
    ClientInfoComponent,
    OptimizedImageDirective,
    ReservationFinanceComponent,
  ],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.scss',
})
export class ReservationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reservations = inject(ReservationService);
  private readonly clients = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);
  detail: ReservationDetails | undefined;
  client: ClientDetailDTO | undefined;
  isLoading = true;
  errorMessage = '';
  get saved(): boolean {
    return this.route.snapshot.queryParamMap.get('saved') === 'true';
  }
  get staff(): boolean {
    return (
      this.route.snapshot.paramMap.has('adminId') ||
      this.route.snapshot.paramMap.has('operatorId')
    );
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
        switchMap(([params]) => {
          this.detail = undefined;
          this.client = undefined;
          this.isLoading = true;
          this.errorMessage = '';
          const id = Number(params.get('id'));
          if (!Number.isSafeInteger(id) || id <= 0) {
            this.errorMessage = 'This reservation could not be found.';
            return of(undefined);
          }
          return this.reservations.details(id).pipe(
            switchMap((detail) =>
              detail.clientId === undefined
                ? of({ detail, client: undefined })
                : this.clients.getById(detail.clientId).pipe(
                    map((client) => ({ detail, client })),
                    catchError(() => of({ detail, client: undefined })),
                  ),
            ),
            catchError(() => {
              this.errorMessage =
                'The reservation could not be loaded. Please try again.';
              return of(undefined);
            }),
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
