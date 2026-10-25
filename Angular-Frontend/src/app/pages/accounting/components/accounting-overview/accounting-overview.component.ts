import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FinancialSummary } from '../../../../models/accounting';

@Component({
  selector: 'app-accounting-overview',
  imports: [CurrencyPipe],
  templateUrl: './accounting-overview.component.html',
  styleUrl: './accounting-overview.component.scss',
})
export class AccountingOverviewComponent {
  @Input({ required: true }) financial: FinancialSummary | undefined;
}
