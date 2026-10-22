import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OperatorDTO } from '../models/dto/operator-dto';
import { Operator } from '../models/operator';

// Cuerpo de POST y PUT: del administrador solo se envía su id.
export type OperatorData = Omit<Operator, 'operatorId' | 'admin'> & {
  admin: { adminId: number };
};

@Injectable({
  providedIn: 'root',
})
export class OperatorService {
  private readonly http = inject(HttpClient);
  // Recurso REST de OperatorController en Spring Boot.
  private readonly apiUrl = 'http://localhost:8080/operators';

  getAll(): Observable<OperatorDTO[]> {
    return this.http.get<OperatorDTO[]>(this.apiUrl);
  }

  // GET /operators?adminId=1 devuelve solo los operadores de ese administrador.
  getByAdministrator(adminId: number): Observable<OperatorDTO[]> {
    return this.http.get<OperatorDTO[]>(this.apiUrl, { params: { adminId } });
  }

  getById(id: number): Observable<OperatorDTO> {
    return this.http.get<OperatorDTO>(`${this.apiUrl}/${id}`);
  }

  // El backend solo lee admin.adminId y asigna el administrador registrado.
  add(operator: OperatorData): Observable<void> {
    return this.http.post<void>(this.apiUrl, operator);
  }

  // El backend conserva la contraseña guardada: solo se usa al crear.
  update(id: number, operator: Omit<OperatorData, 'password'>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, operator);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET /operators/login?email=...&password=...: el backend busca el correo,
  // valida la contraseña y devuelve solo ese operador.
  login(email: string, password: string): Observable<OperatorDTO> {
    return this.http.get<OperatorDTO>(`${this.apiUrl}/login`, { params: { email, password } });
  }
}
