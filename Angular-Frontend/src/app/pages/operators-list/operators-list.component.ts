import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCardsComponent,
  RecordCard,
} from '../../components/record-cards/record-cards.component';
import {
  initialListState,
  matchesSearch,
  compareRecords,
  ListFilter,
} from '../../utils/list-state';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OperatorTableComponent } from './components/operator-table/operator-table.component';
import { OperatorService } from '../../services/operator.service';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-operators-list',
  imports: [
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    OperatorTableComponent,
  ],
  templateUrl: './operators-list.component.html',
  styleUrl: './operators-list.component.scss',
})
export class OperatorsListComponent implements OnInit {
  listState = initialListState();
  get filters(): ListFilter[] {
    return [
      {
        key: 'adminId',
        label: 'Administrator',
        options: Array.from(
          new Map(
            this.operators.map((item) => [
              item.adminId,
              { value: String(item.adminId), label: item.adminName },
            ]),
          ).values(),
        ).sort((a, b) => a.label.localeCompare(b.label)),
      },
    ];
  }
  get filteredItems() {
    return this.operators
      .filter(
        (item) =>
          matchesSearch(this.listState.search, [
            item.operatorId,
            item.name,
            item.lastName,
            item.email,
          ]) &&
          (!this.listState.filters['adminId'] ||
            String(item.adminId) === this.listState.filters['adminId']),
      )
      .sort((a, b) =>
        compareRecords(
          this.listState.sort,
          a.operatorId,
          b.operatorId,
          a.name + ' ' + a.lastName,
          b.name + ' ' + b.lastName,
        ),
      );
  }
  get cards(): RecordCard[] {
    return this.filteredItems.map((item) => ({
      id: item.operatorId,
      title: item.name + ' ' + item.lastName,
      details: [
        { label: 'Email', value: item.email },
        { label: 'Administrator', value: item.adminName },
      ],
      detailUrl: `${this.base}/operators/${item.operatorId}`,
      editUrl: `${this.base}/operators/${item.operatorId}/edit`,
      canDelete: true,
    }));
  }
  deleteCard(id: number): void {
    const item = this.operators.find((item) => item.operatorId === id);
    if (item) this.deleteOperator(item);
  }

  private readonly operatorService = inject(OperatorService);
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
  operators: OperatorDTO[] = [];
  isLoading = true;
  loadError = '';
  message = '';
  errorMessage = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('created') === 'true') {
      this.message = 'Operator created successfully.';
    }
    this.loadOperators();
  }

  loadOperators(): void {
    this.operatorService.getAll().subscribe({
      next: (operators) => {
        this.operators = operators;
        this.loadError = '';
        this.isLoading = false;
      },
      error: () => {
        this.loadError =
          'The operators could not be loaded. Make sure the Spring Boot backend is running at http://localhost:8080 and reload the page.';
        this.isLoading = false;
      },
    });
  }

  deleteOperator(item: OperatorDTO): void {
    this.message = '';
    this.errorMessage = '';
    const fullName = `${item.name} ${item.lastName}`;
    if (!confirm(`Delete operator "${fullName}"? This cannot be undone.`))
      return;
    this.operatorService.delete(item.operatorId).subscribe({
      next: () => {
        this.message = `Operator "${fullName}" deleted successfully.`;
        this.loadOperators();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message ||
          `Operator "${fullName}" could not be deleted. Please try again.`;
      },
    });
  }
}
