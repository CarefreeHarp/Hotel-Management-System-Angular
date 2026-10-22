import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap } from 'rxjs';
import { ServiceCatalogDTO } from '../models/dto/service-catalog-dto';
import { ServiceDetailDTO } from '../models/dto/service-detail-dto';
import { ServiceListDTO } from '../models/dto/service-list-dto';
import { Service } from '../models/service';

// Omit conserva los campos del modelo salvo el id que genera la base de datos.
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
  // El POST devuelve un cuerpo vacío. concatMap espera su respuesta antes de consultar el id para navegar.
  add(service: ServiceData): Observable<ServiceDetailDTO> {
    return this.http
      .post<void>(this.apiUrl, service)
      .pipe(concatMap(() => this.getByUrlName(service.urlName)));
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
