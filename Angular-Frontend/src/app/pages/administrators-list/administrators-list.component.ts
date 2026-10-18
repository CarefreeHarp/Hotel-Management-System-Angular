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
import { AdministratorTableComponent } from './components/administrator-table/administrator-table.component';
import { AdministratorService } from '../../services/administrator.service';
import { AdministratorListDTO } from '../../models/dto/administrator-list-dto';
import { basePath } from '../../utils/base-path';
import { apiErrorMessage } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-administrators-list',
  imports: [
    ListControlsComponent,
    RecordCardsComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    AdministratorTableComponent,
  ],
  templateUrl: './administrators-list.component.html',
  styleUrl: './administrators-list.component.scss',
})
export class AdministratorsListComponent implements OnInit {
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
        { label: 'Email', value: item.email },
        { label: 'Operators', value: String(item.operatorCount) },
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

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('created') === 'true') {
      this.message = 'Administrator created successfully.';
    }
    this.loadAdministrators();
  }

  // Cada fila ya trae cuántos operadores tiene el administrador (COUNT en la consulta),
  // así que no se descarga la lista de operadores.
  loadAdministrators(): void {
    this.administratorService.getAll().subscribe({
      next: (administrators) => {
        this.administrators = administrators;
        this.isLoading = false;
      },
      // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }

  deleteAdministrator(item: AdministratorListDTO): void {
    this.message = '';
    this.errorMessage = '';
    if (!confirm(`Delete administrator "${item.name}"? This cannot be undone.`))
      return;
    this.administratorService.delete(item.adminId).subscribe({
      next: () => {
        this.message = `Administrator "${item.name}" deleted successfully.`;
        this.loadAdministrators();
      },
      // La regla está en el backend: con operadores a cargo responde 409 con el motivo.
      error: (error: HttpErrorResponse) => {
        this.errorMessage = apiErrorMessage(
          error,
          `Administrator "${item.name}" could not be deleted. Please try again.`,
        );
      },
    });
  }
}
