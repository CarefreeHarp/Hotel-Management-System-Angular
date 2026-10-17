import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';
import { ReservationService } from '../../services/reservation.service';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ReservationDetails } from '../../models/booking';
import { ReservationDTO } from '../../models/dto/reservation-dto';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { ReservationStatus } from '../../models/enums/reservation-status';
import { basePath } from '../../utils/base-path';

const ACTIVE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

@Component({
  selector: 'app-client-profile',
  imports: [ RouterLink, HeaderComponent, PageHeadingComponent, ButtonComponent, ReservationHistoryComponent],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.scss',
})
export class ClientProfileComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  // /client/:clientId: los enlaces del perfil conservan la id del cliente.
  readonly base = basePath(this.route);
  client: ClientDetailDTO | undefined;
  reservations: ReservationDetails[] = [];
  isLoading = true;
  isDeleting = false;
  saved = false;
  loadError = '';
  errorMessage = '';

  ngOnInit(): void {
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    // El guard de /client/:clientId ya pidió este cliente al backend con la id de la URL
    // y lo dejó en la sesión: aquí solo se piden sus reservas, sin repetir GET /clients/{id}.
    this.client = this.authService.session()?.client;
    if (!this.client) {
      this.loadError = 'Your profile could not be loaded. Please sign in again.';
      this.isLoading = false;
      return;
    }
    this.reservationService
      .history(this.client.clientId)
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError =
            error.error?.message || 'Your profile could not be loaded. Make sure the backend is running and try again.';
          this.isLoading = false;
        },
      });
  }

  isActive(reservation: ReservationDTO): boolean {
    return ACTIVE_STATUSES.includes(reservation.status);
  }

  statusLabel(status: ReservationStatus): string {
    return status.replace('_', ' ').toLowerCase();
  }

  deleteAccount(): void {
    if (!this.client || this.isDeleting) return;
    this.errorMessage = '';
    if (!confirm('Delete your Atlan Suites account? This cannot be undone.')) return;
    this.isDeleting = true;
    this.clientService.delete(this.client.clientId).subscribe({
      next: () => {
        this.authService.logout();
        void this.router.navigate(['/']);
      },
      // Un cliente con reservas no se puede eliminar: el backend responde 409 con el motivo.
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Your account could not be deleted. Please try again.';
        this.isDeleting = false;
      },
    });
  }
}
