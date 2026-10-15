import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ServiceTableComponent } from './components/service-table/service-table.component';
import { ServiceService } from '../../services/service.service';
import { ServiceListDTO } from '../../models/dto/service-list-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-services-list',
  imports: [
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    ServiceTableComponent,
  ],
  templateUrl: './services-list.component.html',
  styleUrl: './services-list.component.scss',
})
export class ServicesListComponent {
  private readonly service = inject(ServiceService);
  readonly base = basePath(inject(ActivatedRoute));
  // Una sola petición trae todos los servicios; cada sección muestra los suyos.
  activeServices: ServiceListDTO[] = [];
  inactiveServices: ServiceListDTO[] = [];
  loading = true;
  loadFailed = false;
  error = '';
  message = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    this.service.getAll().subscribe({
      next: (items) => {
        this.activeServices = items.filter((item) => item.active);
        this.inactiveServices = items.filter((item) => !item.active);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadFailed = true;
        this.loading = false;
        this.error =
          error.status === 0
            ? 'Cannot connect to Spring Boot at localhost:8080. Start the backend and try again.'
            : 'Unable to load services from the server. Please try again.';
      },
    });
  }

  deactivateService(item: ServiceListDTO): void {
    this.clearNotices();
    this.service.deactivate(item.serviceId).subscribe({
      next: () => this.showMessage(`"${item.name}" was deactivated: it left the guest catalog and moved to Inactive services.`),
      error: (error: HttpErrorResponse) => this.showError(error, 'Unable to deactivate this service. Please try again.'),
    });
  }

  activateService(item: ServiceListDTO): void {
    this.clearNotices();
    this.service.activate(item.serviceId).subscribe({
      next: () => this.showMessage(`"${item.name}" was activated and is back in the list and the guest catalog.`),
      error: (error: HttpErrorResponse) => this.showError(error, 'Unable to activate this service. Please try again.'),
    });
  }

  private clearNotices(): void {
    this.message = '';
    this.error = '';
  }

  private showMessage(message: string): void {
    this.message = message;
    this.load();
    this.scrollToNotices();
  }

  private showError(error: HttpErrorResponse, fallback: string): void {
    this.error = error.error?.message || fallback;
    this.scrollToNotices();
  }

  // Los avisos están arriba de las tablas: si se actuó desde la sección de inactivos, se sube para verlos.
  private scrollToNotices(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
