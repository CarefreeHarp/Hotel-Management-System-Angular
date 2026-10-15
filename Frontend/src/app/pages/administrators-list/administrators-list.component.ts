import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { AdministratorTableComponent } from './components/administrator-table/administrator-table.component';
import { AdministratorService } from '../../services/administrator.service';
import { AdministratorListDTO } from '../../models/dto/administrator-list-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-administrators-list',
  imports: [
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    AdministratorTableComponent,
  ],
  templateUrl: './administrators-list.component.html',
  styleUrl: './administrators-list.component.scss',
})
export class AdministratorsListComponent implements OnInit {
  private readonly administratorService = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  readonly base = basePath(this.route);
  administrators: AdministratorListDTO[] = [];
  isLoading = true;
  loadError = '';
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
        this.loadError = '';
        this.isLoading = false;
      },
      error: () => {
        this.loadError =
          'The administrators could not be loaded. Make sure the Spring Boot backend is running at http://localhost:8080 and reload the page.';
        this.isLoading = false;
      },
    });
  }

  deleteAdministrator(item: AdministratorListDTO): void {
    this.message = '';
    this.errorMessage = '';
    if (!confirm(`Delete administrator "${item.name}"? This cannot be undone.`)) return;
    this.administratorService.delete(item.adminId).subscribe({
      next: () => {
        this.message = `Administrator "${item.name}" deleted successfully.`;
        this.loadAdministrators();
      },
      // La regla está en el backend: con operadores a cargo responde 409 con el motivo.
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || `Administrator "${item.name}" could not be deleted. Please try again.`;
      },
    });
  }
}
