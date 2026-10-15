import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceListDTO } from '../../../../models/dto/service-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-service-table',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './service-table.component.html',
  styleUrl: './service-table.component.scss',
})
export class ServiceTableComponent {
  @Input({ required: true }) services: ServiceListDTO[] = [];
  // La misma tabla sirve para las dos secciones: en la de inactivos cambian los botones.
  // No hay botón de eliminar: un servicio forma parte del historial de reservas, solo se desactiva.
  @Input() inactive = false;
  @Output() deactivate = new EventEmitter<ServiceListDTO>();
  @Output() activate = new EventEmitter<ServiceListDTO>();
  readonly base = basePath(inject(ActivatedRoute));
}
