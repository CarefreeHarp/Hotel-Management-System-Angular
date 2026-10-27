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
import { AdministratorListDTO } from '../../models/dto/administrator-list-dto';
import { AdministratorService } from '../../services/administrator.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  compareRecords,
  initialListState,
  ListFilter,
  matchesSearch,
} from '../../utils/list-state';
import { AdministratorTableComponent } from './components/administrator-table/administrator-table.component';

/** Coordina la lista de administradores, sus filtros y acciones. Los componentes hijos presentan los registros. */
@Component({
  selector: 'app-administrators-list',
  imports: [
    SkeletonComponent,
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    AdministratorTableComponent,
    TranslocoPipe,
  ],
  templateUrl: './administrators-list.component.html',
  styleUrl: './administrators-list.component.scss',
})
export class AdministratorsListComponent implements OnInit {

  private readonly actionSubject = new Subject<AdministratorListDTO>();
  private readonly loadSubject = new Subject<void>();
  listState = initialListState();
  readonly filters: ListFilter[] = [];
  get filteredItems() {
    return this.administrators
      .filter((item) =>
        matchesSearch(this.listState.search, [
          item.adminId,
          item.name,
          item.email,
        ]),
      )
      .sort((a, b) =>
        compareRecords(
          this.listState.sort,
          a.adminId,
          b.adminId,
          a.name,
          b.name,
        ),
      );
  }
  get cards(): RecordCard[] {
    return this.filteredItems.map((item) => ({
      id: item.adminId,
      title: item.name,
      details: [
        { labelKey: 'common.fields.email', value: item.email },
        { labelKey: 'administrators.fields.operators', value: String(item.operatorCount) },
      ],
      detailUrl: `${this.base}/administrators/${item.adminId}`,
      editUrl: `${this.base}/administrators/${item.adminId}/edit`,
      canDelete: true,
    }));
  }
  deleteCard(id: number): void {
    const item = this.administrators.find((item) => item.adminId === id);
    if (item) this.deleteAdministrator(item);
  }

  private readonly administratorService = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  administrators: AdministratorListDTO[] = [];
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
      this.message = translate('administrators.list.created');
    }
    this.loadAdministrators();
  }

  // Cada fila ya trae cuántos operadores tiene el administrador (COUNT en la consulta),
  // así que no se descarga la lista de operadores.
  loadAdministrators(): void {
    this.loadSubject.next();
  }

  private loadRecords(): Observable<unknown> {
    return this.administratorService.getAll().pipe(
      tap((administrators) => {
        this.administrators = administrators;
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }

  deleteAdministrator(item: AdministratorListDTO): void {
    this.actionSubject.next(item);
  }

  private performAction(item: AdministratorListDTO): Observable<unknown> {
    this.message = '';
    this.errorMessage = '';
    if (!confirm(translate('administrators.list.confirmDelete', { name: item.name })))
      return EMPTY;
    return this.administratorService.delete(item.adminId).pipe(
      tap(() => {
        this.message = translate('administrators.list.deleted', { name: item.name });
        this.loadAdministrators();
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = apiErrorMessage(error, 'administrators.list.deleteError', {
          name: item.name,
        });

        return EMPTY;
      }),
    );
  }
}
