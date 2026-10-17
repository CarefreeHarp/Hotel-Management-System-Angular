import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientService } from '../../services/client.service';
import { ClientTableComponent } from './components/client-table/client-table.component';
import { ClientListDTO } from '../../models/dto/client-list-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-clients-list',
  imports: [AdminHeaderComponent, RouterLink, ButtonComponent, ClientTableComponent],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
})
export class ClientsListComponent implements OnInit {
  private readonly service = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  readonly base = basePath(this.route);
  clients: ClientListDTO[] = [];
  isLoading = true;
  loadError = '';
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
    this.loadError = '';
    this.service.getAll().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Clients could not be loaded. Please try again.';
        this.isLoading = false;
      },
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
        this.errorMessage = error.error?.message || 'The client could not be deleted. Please try again.';
      },
    });
  }
}
