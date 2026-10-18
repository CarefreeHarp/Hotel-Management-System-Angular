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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientService } from '../../services/client.service';
import { ClientTableComponent } from './components/client-table/client-table.component';
import { ClientListDTO } from '../../models/dto/client-list-dto';
import { basePath } from '../../utils/base-path';
import { apiErrorMessage } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-clients-list',
  imports: [
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    ClientTableComponent,
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
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
        { label: 'Email', value: item.email },
        { label: 'Phone', value: item.phone },
        { label: 'National ID', value: item.nationalId },
      ],
      detailUrl: `${this.base}/clients/${item.clientId}`,
      editUrl: `${this.base}/clients/${item.clientId}/edit`,
      canDelete: true,
    }));
  }
  deleteCard(id: number): void {
    const item = this.clients.find((item) => item.clientId === id);
    if (item) this.deleteClient(item);
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

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('created') === 'true') {
      this.message = 'Client created successfully.';
    }
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoading = false;
      },
      // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }

  deleteClient(client: ClientListDTO): void {
    this.message = '';
    this.errorMessage = '';
    const name = `${client.name} ${client.lastName}`;
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    this.service.delete(client.clientId).subscribe({
      next: () => {
        this.message = 'Client deleted successfully.';
        this.loadClients();
      },
      // La regla está en el backend: si tiene reservas responde 409 con el motivo.
      error: (error: HttpErrorResponse) => {
        this.errorMessage = apiErrorMessage(
          error,
          'The client could not be deleted. Please try again.',
        );
      },
    });
  }
}
