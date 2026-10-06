import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ServiceTableComponent } from './components/service-table/service-table.component';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service';

@Component({
  selector: 'app-services-list',
  imports: [
    RouterLink,
    HeaderComponent,
    ButtonComponent,
    ServiceTableComponent,
  ],
  templateUrl: './services-list.component.html',
  styleUrl: './services-list.component.scss',
})
export class ServicesListComponent {
  private readonly service = inject(ServiceService);
  services = this.service.getAll();
  message = '';

  deleteService(item: Service): void {
    if (!window.confirm(`Delete "${item.name}"? This action cannot be undone.`))
      return;
    this.service.delete(item.serviceId);
    this.services = this.service.getAll();
    this.message = `Service "${item.name}" deleted successfully.`;
  }
}
