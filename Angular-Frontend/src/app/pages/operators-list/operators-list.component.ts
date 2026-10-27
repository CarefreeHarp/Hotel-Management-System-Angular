import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { catchError, EMPTY, exhaustMap, Observable, Subject, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import {
  RecordCard,
  RecordCardsComponent,
} from '../../components/record-cards/record-cards.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { OperatorService } from '../../services/operator.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  compareRecords,
  initialListState,
  ListFilter,
  matchesSearch,
} from '../../utils/list-state';
import { OperatorTableComponent } from './components/operator-table/operator-table.component';

/** Coordina la lista de operarios, sus filtros y acciones. Los componentes hijos presentan los registros. */
@Component({
  selector: 'app-operators-list',
  imports: [
    SkeletonComponent,
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    OperatorTableComponent,
    TranslocoPipe,
  ],
  templateUrl: './operators-list.component.html',
  styleUrl: './operators-list.component.scss',
})
export class OperatorsListComponent implements OnInit {

  private readonly actionSubject = new Subject<OperatorDTO>();
  private readonly loadSubject = new Subject<void>();
  listState = initialListState();
  get filters(): ListFilter[] {
    return [
      {
        key: 'adminId',
        labelKey: 'operators.fields.administrator',
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
        { labelKey: 'common.fields.email', value: item.email },
        { labelKey: 'operators.fields.administrator', value: item.adminName },
      ],
      detailUrl: `${this.base}/operators/${item.operatorId}`,
      editUrl: `${this.base}/operators/${item.operatorId}/edit`,
      canDelete: true,
    }));
  }
  deleteCard(id: number): void {
    const item = this.operators.find((item) => item.operatorId === id);
    if (item) {
      this.deleteOperator(item);
    }
  }

  private readonly operatorService = inject(OperatorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  operators: OperatorDTO[] = [];
  isLoading = true;
  message = '';
  errorMessage = '';

  constructor() {
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap((item) => this.performAction(item)),
      takeUntilDestroyed(),
    ).subscribe();
    // Una recarga sustituye la lectura anterior. Las escrituras usan un flujo independiente.
    this.loadSubject.pipe(
      switchMap(() => this.loadRecords()),
      takeUntilDestroyed(),
    ).subscribe();
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('created') === 'true') {
      this.message = translate('operators.list.created');
    }
    this.loadOperators();
  }

  loadOperators(): void {
    this.loadSubject.next();
  }

  private loadRecords(): Observable<unknown> {
    return this.operatorService.getAll().pipe(
      tap((operators) => {
        this.operators = operators;
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }

  deleteOperator(item: OperatorDTO): void {
    this.actionSubject.next(item);
  }

  private performAction(item: OperatorDTO): Observable<unknown> {
    this.message = '';
    this.errorMessage = '';
    const fullName = `${item.name} ${item.lastName}`;
    if (!confirm(translate('operators.list.confirmDelete', { name: fullName }))) {
      return EMPTY;
    }
    return this.operatorService.delete(item.operatorId).pipe(
      tap(() => {
        this.message = translate('operators.list.deleted', { name: fullName });
        this.loadOperators();
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = apiErrorMessage(error, 'operators.list.deleteError', {
          name: fullName,
        });

        return EMPTY;
      }),
    );
  }
}
