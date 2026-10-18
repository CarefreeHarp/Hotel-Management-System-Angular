import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, mergeMap, throwError } from 'rxjs';
import { Client } from '../models/client';
import { ClientDetailDTO } from '../models/dto/client-detail-dto';
import { AdministratorDTO } from '../models/dto/administrator-dto';
import { OperatorDTO } from '../models/dto/operator-dto';
import { ClientService } from './client.service';
import { AdministratorService } from './administrator.service';
import { OperatorService } from './operator.service';

export type UserRole = 'CLIENT' | 'ADMINISTRATOR' | 'OPERATOR';

export interface StaffUser {
  id: number;
  name: string;
  lastName?: string;
  email: string;
  role: 'ADMINISTRATOR' | 'OPERATOR';
}

function adminToStaff(admin: AdministratorDTO): StaffUser {
  return {
    id: admin.adminId,
    name: admin.name,
    email: admin.email,
    role: 'ADMINISTRATOR',
  };
}

function operatorToStaff(operator: OperatorDTO): StaffUser {
  return {
    id: operator.operatorId,
    name: operator.name,
    lastName: operator.lastName,
    email: operator.email,
    role: 'OPERATOR',
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly clientService = inject(ClientService);
  private readonly adminService = inject(AdministratorService);
  private readonly operatorService = inject(OperatorService);

  /**
   * Comprueba las credenciales del cliente. El backend busca el correo, valida la contraseña
   * y devuelve el cliente; su id es la que va en la URL del perfil.
   */
  loginClient(email: string, password: string): Observable<ClientDetailDTO> {
    return this.clientService
      .login(email.trim(), password)
      .pipe(
        catchError(() =>
          throwError(() => new Error('Incorrect email or password.')),
        ),
      );
  }

  /**
   * Registra un nuevo cliente en el backend y comprueba sus credenciales. El
   * backend revisa que el correo y el documento no estén registrados.
   */
  registerClient(
    clientData: Omit<Client, 'clientId'>,
  ): Observable<ClientDetailDTO> {
    return this.clientService.add(clientData).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(
          () => new Error(error.error?.message || 'Guest registration failed.'),
        ),
      ),
      mergeMap(() => this.loginClient(clientData.email, clientData.password)),
    );
  }

  /**
   * Comprueba las credenciales del personal: primero se prueba como administrador y, si el
   * backend lo rechaza, como operador.
   */
  loginStaff(email: string, password: string): Observable<StaffUser> {
    const trimmedEmail = email.trim();

    return this.adminService.login(trimmedEmail, password).pipe(
      map((admin) => adminToStaff(admin)),
      catchError(() =>
        this.operatorService
          .login(trimmedEmail, password)
          .pipe(map((operator) => operatorToStaff(operator))),
      ),
      catchError(() =>
        throwError(() => new Error('Incorrect staff credentials.')),
      ),
    );
  }
}
