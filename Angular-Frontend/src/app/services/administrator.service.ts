import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Administrator } from '../models/administrator';
import { AdministratorListDTO } from '../models/dto/administrator-list-dto';
import { AdministratorDTO } from '../models/dto/administrator-dto';

@Injectable({
  providedIn: 'root',
})
export class AdministratorService {
  private readonly http = inject(HttpClient);
  // Recurso REST de AdministratorController en Spring Boot.
  private readonly apiUrl = 'http://localhost:8080/administrators';

  // Filas de la tabla, con cuántos operarios tiene cada uno.
  getAll(): Observable<AdministratorListDTO[]> {
    return this.http.get<AdministratorListDTO[]>(this.apiUrl);
  }

  // Id, nombre y correo, para el selector del formulario de operarios.
  getOptions(): Observable<AdministratorDTO[]> {
    return this.http.get<AdministratorDTO[]>(`${this.apiUrl}/options`);
  }

  getById(id: number): Observable<AdministratorDTO> {
    return this.http.get<AdministratorDTO>(`${this.apiUrl}/${id}`);
  }

  // El backend genera el id y responde sin cuerpo.
  add(administrator: Omit<Administrator, 'adminId'>): Observable<void> {
    return this.http.post<void>(this.apiUrl, administrator);
  }

  // El backend conserva la contraseña guardada: solo se usa al crear.
  update(id: number, administrator: Omit<Administrator, 'password'>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, administrator);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET /administrators/login?email=...&password=...: el backend busca el correo,
  // valida la contraseña y devuelve solo ese administrador.
  login(email: string, password: string): Observable<AdministratorDTO> {
    return this.http.get<AdministratorDTO>(`${this.apiUrl}/login`, { params: { email, password } });
  }
}
