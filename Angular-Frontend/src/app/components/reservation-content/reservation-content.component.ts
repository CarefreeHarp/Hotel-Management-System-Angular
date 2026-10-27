import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ReservationDetails } from '../../models/booking';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientInfoComponent } from '../client-info/client-info.component';
import { ReservationFinanceComponent } from '../reservation-finance/reservation-finance.component';

/** Comparte el detalle y su distribución. La edición proyecta sus campos sin modificar datos del huésped ni pagos. */
@Component({
  selector: 'app-reservation-content',
  imports: [CurrencyPipe, DatePipe, ClientInfoComponent, OptimizedImageDirective, ReservationFinanceComponent, TranslocoPipe],
  templateUrl: './reservation-content.component.html',
  styleUrl: './reservation-content.component.scss',
})
export class ReservationContentComponent {
  @Input({ required: true }) detail: ReservationDetails | undefined;
  @Input() client: ClientDetailDTO | undefined;
  @Input() editing = false;
  // Clave del título de la vista del personal (admin u operario). Vacía en la vista del cliente.
  @Input() staffViewTitleKey = '';
}
