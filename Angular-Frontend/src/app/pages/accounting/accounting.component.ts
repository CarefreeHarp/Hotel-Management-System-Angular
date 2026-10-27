import {
  AsyncPipe,
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import {
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { AccountingDashboard } from '../../models/accounting';
import { AccountingService } from '../../services/accounting.service';
import { basePath } from '../../utils/base-path';
import {
  AccountingCharts,
  buildAccountingCharts,
  statusLabel,
} from './accounting-chart-options';
import { AccountingOverviewComponent } from './components/accounting-overview/accounting-overview.component';
import { AnalyticsChartComponent } from './components/analytics-chart/analytics-chart.component';

interface AccountingState {
  loading: boolean;
  data?: AccountingDashboard;
  charts?: AccountingCharts;
  reservationCount?: number;
  error: string;
}

/** La URL conserva el período. Cada cambio reemplaza la lectura anterior y AsyncPipe libera la suscripción. */
@Component({
  selector: 'app-accounting',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FormsModule,
    AdminHeaderComponent,
    ButtonComponent,
    SkeletonComponent,
    AccountingOverviewComponent,
    AnalyticsChartComponent,
    TranslocoPipe,
  ],
  templateUrl: './accounting.component.html',
  styleUrl: './accounting.component.scss',
})
export class AccountingComponent {
  private readonly service = inject(AccountingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refreshSubject = new Subject<void>();
  private readonly year = new Date().getFullYear();
  from = `${this.year}-01-01`;
  to = `${this.year + 1}-12-31`;
  readonly statusLabel = statusLabel;
  readonly state$: Observable<AccountingState> = combineLatest([
    this.route.queryParamMap,
    this.refreshSubject.pipe(startWith(undefined)),
  ]).pipe(
    // Los filtros cambian únicamente consultas de lectura, por lo que se cancela la anterior.
    switchMap(([params]) => {
      this.from = params.get('from') ?? `${this.year}-01-01`;
      this.to = params.get('to') ?? `${this.year + 1}-12-31`;
      return this.service.getDashboard({ from: this.from, to: this.to }).pipe(
        map((data) => ({
          loading: false,
          data,
          charts: buildAccountingCharts(data),
          reservationCount: data.trend.reduce(
            (total, item) => total + item.reservations,
            0,
          ),
          error: '',
        })),
        // El error queda dentro de la consulta. Cambiar filtros o reintentar mantiene vivo el flujo.
        catchError(() =>
          of({
            loading: false,
            error: translate('accounting.loadError'),
          }),
        ),
        startWith({ loading: true, error: '' }),
      );
    }),
  );

  applyFilters(): void {
    if (!this.from || !this.to || this.from > this.to) {
      return;
    }
    void this.router.navigate([basePath(this.route), 'accounting'], {
      queryParams: { from: this.from, to: this.to },
    });
  }

  retry(): void {
    this.refreshSubject.next();
  }
}
