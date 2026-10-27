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
import { ClientListDTO } from '../../models/dto/client-list-dto';
import { ClientService } from '../../services/client.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  compareRecords,
  initialListState,
  ListFilter,
  matchesSearch,
} from '../../utils/list-state';
import { ClientTableComponent } from './components/client-table/client-table.component';

/** Coordina la lista de clientes, sus filtros y acciones. Los componentes hijos presentan los registros. */
@Component({
  selector: 'app-clients-list',
  imports: [
    SkeletonComponent,
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    ClientTableComponent,
    TranslocoPipe,
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {

  private readonly actionSubject = new Subject<ClientListDTO>();
  private readonly loadSubject = new Subject<void>();
  listState = initialListState();
  readonly filters: ListFilter[] = [];
  get filteredItems() {
    return this.clients
      .filter((item) =>
        matchesSearch(this.listState.search, [
          item.clientId,
          item.name,
          item.lastName,
          item.nationalId,
          item.email,
          item.phone,
        ]),
      )
      .sort((a, b) =>
        compareRecords(
          this.listState.sort,
          a.clientId,
          b.clientId,
          a.name + ' ' + a.lastName,
          b.name + ' ' + b.lastName,
        ),
      );
  }
  get cards(): RecordCard[] {
    return this.filteredItems.map((item) => ({
      id: item.clientId,
      title: item.name + ' ' + item.lastName,
      details: [
        { labelKey: 'common.fields.email', value: item.email },
        { labelKey: 'common.fields.phone', value: item.phone },
        { labelKey: 'common.fields.nationalId', value: item.nationalId },
      ],
      detailUrl: `${this.base}/clients/${item.clientId}`,
      editUrl: `${this.base}/clients/${item.clientId}/edit`,
      canDelete: true,
    }));
  }
  deleteCard(id: number): void {
    const item = this.clients.find((item) => item.clientId === id);
    if (item) {
      this.deleteClient(item);
    }
  }

  private readonly service = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  clients: ClientListDTO[] = [];
  isLoading = true;
  message = '';
  errorMessage = '';

  constructor() {
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap((client) => this.performAction(client)),
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
      this.message = translate('clients.list.created');
    }
    this.loadClients();
  }

  loadClients(): void {
    this.loadSubject.next();
  }

  private loadRecords(): Observable<unknown> {
    this.isLoading = true;
    return this.service.getAll().pipe(
      tap((clients) => {
        this.clients = clients;
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }

  deleteClient(client: ClientListDTO): void {
    this.actionSubject.next(client);
  }

  private performAction(client: ClientListDTO): Observable<unknown> {
    this.message = '';
    this.errorMessage = '';
    const name = `${client.name} ${client.lastName}`;
    if (!confirm(translate('clients.list.confirmDelete', { name }))) {
      return EMPTY;
    }
    return this.service.delete(client.clientId).pipe(
      tap(() => {
        this.message = translate('clients.list.deleted');
        this.loadClients();
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = apiErrorMessage(error, 'clients.list.deleteError');

        return EMPTY;
      }),
    );
  }
}
