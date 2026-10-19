import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientInfoComponent } from '../../components/client-info/client-info.component';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ReservationDetails } from '../../models/booking';
import { clientQuery } from '../../utils/client-query';
import { apiErrorMessage } from '../../utils/api-error';
import { catchErrorPage } from '../../utils/error-page';

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
  ],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.scss',
})
export class ClientProfileComponent implements OnInit {
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
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const id = this.authParams.auth;
          this.client = undefined;
          this.reservations = [];
          this.isLoading = true;
          this.saved = params.get('saved') === 'true';
          if (id === undefined) {
            void this.router.navigate(['/login'], { replaceUrl: true });
            return of(undefined);
          }
          // Si auth apunta a un cliente que no existe o falla el servidor, se muestra la pantalla de error.
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
  deleteAccount(): void {
    if (
      !this.client ||
      this.isDeleting ||
      !confirm('Delete your Atlan Suites account? This cannot be undone.')
    )
      return;
    this.isDeleting = true;
    this.errorMessage = '';
    this.clients
      .delete(this.client.clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Your account could not be deleted.',
          );
          this.isDeleting = false;
        },
      });
  }
}
