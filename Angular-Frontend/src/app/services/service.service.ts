import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Service } from '../models/service';
import { ServiceListDTO } from '../models/dto/service-list-dto';
import { ServiceCatalogDTO } from '../models/dto/service-catalog-dto';
import { ServiceDetailDTO } from '../models/dto/service-detail-dto';

// Los formularios incluyen la disponibilidad independiente del registro.
export type ServiceData = Omit<Service, 'serviceId'>;

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/services';
  // Filas de la tabla del panel, activos e inactivos.
  getAll(): Observable<ServiceListDTO[]> {
    return this.http.get<ServiceListDTO[]>(this.apiUrl);
  }
  // Catálogo de los huéspedes: solo servicios activos.
  getCatalog(): Observable<ServiceCatalogDTO[]> {
    return this.http.get<ServiceCatalogDTO[]>(this.apiUrl + '/catalog');
  }
  getById(id: number): Observable<ServiceDetailDTO> {
    return this.http.get<ServiceDetailDTO>(this.apiUrl + '/' + id);
  }
  getByUrlName(urlName: string): Observable<ServiceDetailDTO> {
    return this.http.get<ServiceDetailDTO>(
      this.apiUrl + '/by-url-name/' + encodeURIComponent(urlName),
    );
  }
  add(service: ServiceData): Observable<ServiceDetailDTO> {
    return this.http
      .post<void>(this.apiUrl, service)
      .pipe(switchMap(() => this.getByUrlName(service.urlName)));
  }
  update(id: number, service: ServiceData): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id, service);
  }
  // PUT sin cuerpo: cambia solo la disponibilidad.
  activate(id: number): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id + '/activate', null);
  }
  deactivate(id: number): Observable<void> {
    return this.http.put<void>(this.apiUrl + '/' + id + '/deactivate', null);
  }
}
