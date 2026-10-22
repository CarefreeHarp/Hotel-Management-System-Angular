import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Client } from '../models/client';
import { ClientDetailDTO } from '../models/dto/client-detail-dto';
import { ClientListDTO } from '../models/dto/client-list-dto';

type ClientResponse = Omit<ClientDetailDTO, 'profilePhoto'> & { profilePhoto?: string | null };

// H2 devuelve null si falta la foto. El modelo de Angular omite esa propiedad.
function normalizeClient({ profilePhoto, ...client }: ClientResponse): ClientDetailDTO {
  return profilePhoto ? { ...client, profilePhoto } : client;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/clients';

  // Filas de la tabla: sin foto ni contraseña.
  getAll(): Observable<ClientListDTO[]> {
    return this.http.get<ClientListDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<ClientDetailDTO> {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`).pipe(map(normalizeClient));
  }

  add(client: Omit<Client, 'clientId'>): Observable<void> {
    return this.http.post<void>(this.apiUrl, client);
  }

  // El backend conserva la contraseña guardada: el formulario de edición no la envía.
  update(id: number, client: Omit<Client, 'password'>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET /clients/login?email=...&password=...: el backend busca el correo,
  // valida la contraseña y devuelve solo ese cliente.
  login(email: string, password: string): Observable<ClientDetailDTO> {
    return this.http
      .get<ClientResponse>(`${this.apiUrl}/login`, { params: { email, password } })
      .pipe(map(normalizeClient));
  }
}
