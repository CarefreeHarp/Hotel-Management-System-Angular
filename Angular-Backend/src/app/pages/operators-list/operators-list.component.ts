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
  imports: [AdminHeaderComponent, RouterLink, ButtonComponent, OperatorTableComponent],
  templateUrl: './operators-list.component.html',
  styleUrl: './operators-list.component.scss',
})
export class OperatorsListComponent implements OnInit {
  private readonly operatorService = inject(OperatorService);
  private readonly route = inject(ActivatedRoute);
  readonly base = basePath(this.route);
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
    if (!confirm(`Delete operator "${fullName}"? This cannot be undone.`)) return;
    this.operatorService.delete(item.operatorId).subscribe({
      next: () => {
        this.message = `Operator "${fullName}" deleted successfully.`;
        this.loadOperators();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || `Operator "${fullName}" could not be deleted. Please try again.`;
      },
    });
  }
}
