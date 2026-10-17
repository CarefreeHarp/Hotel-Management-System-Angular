import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationDetails } from '../../models/booking';
@Component({ selector: 'app-reservation-history', imports: [CurrencyPipe, DatePipe, RouterLink], templateUrl: './reservation-history.component.html', styleUrl: './reservation-history.component.scss' })
export class ReservationHistoryComponent {
    readonly reservations = input.required<ReservationDetails[]>();
    readonly staff = input(false);
}
