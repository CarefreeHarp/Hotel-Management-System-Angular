import { Component } from '@angular/core';
import { inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { ReservationDetails } from '../../models/booking';
@Component({ selector: 'app-reservation-detail', imports: [HeaderComponent, ReservationHistoryComponent, CurrencyPipe, RouterLink], templateUrl: './reservation-detail.component.html', styleUrl: './reservation-detail.component.scss' })
export class ReservationDetailComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly service = inject(ReservationService);
    readonly auth = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);
    detail: ReservationDetails | undefined;
    loading = true;
    error = '';
    ngOnInit(): void { this.route.paramMap.pipe(switchMap(params => this.service.details(Number(params.get('reservationId')))), takeUntilDestroyed(this.destroyRef)).subscribe({ next: detail => { this.detail = detail; this.loading = false; }, error: () => { this.error = 'Reservation not found or unavailable.'; this.loading = false; } }); }
}
