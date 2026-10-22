import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, concatMap, map, throwError } from 'rxjs';
import { Client } from '../models/client';
import { AdministratorDTO } from '../models/dto/administrator-dto';
import { ClientDetailDTO } from '../models/dto/client-detail-dto';
import { OperatorDTO } from '../models/dto/operator-dto';
import { apiErrorMessage } from '../utils/api-error';
import { AdministratorService } from './administrator.service';
import { ClientService } from './client.service';
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

// Un 401 son credenciales incorrectas. Sin conexión o con el servidor caído se explica el motivo real.
function loginError(error: unknown, invalidCredentials: string): Error {
  return new Error(
    error instanceof HttpErrorResponse && error.status === 401
      ? invalidCredentials
      : apiErrorMessage(error, 'Sign-in failed. Please try again.'),
  );
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
   * y devuelve el cliente. Su id es la que va en la URL del perfil.
   */
  loginClient(email: string, password: string): Observable<ClientDetailDTO> {
    return this.clientService
      .login(email.trim(), password)
      .pipe(
        catchError((error: unknown) =>
          throwError(() => loginError(error, 'Incorrect email or password.')),
        ),
      );
  }

  /**
   * Registra un nuevo cliente en el backend y comprueba sus credenciales. El
   * backend revisa los campos y que el correo y el documento no estén
   * registrados. Su error HTTP llega intacto para mostrar cada campo rechazado.
   */
  registerClient(
    clientData: Omit<Client, 'clientId'>,
  ): Observable<ClientDetailDTO> {
    return this.clientService
      .add(clientData)
      .pipe(
        // concatMap ejecuta el login después de que termine el registro, conservando ese orden.
        concatMap(() => this.loginClient(clientData.email, clientData.password)),
      );
  }

  /**
   * Comprueba las credenciales del personal: primero se prueba como administrador y, si el
   * backend responde 401, como operador. Otros errores no se reintentan.
   */
  loginStaff(email: string, password: string): Observable<StaffUser> {
    const trimmedEmail = email.trim();

    return this.adminService.login(trimmedEmail, password).pipe(
      map((admin) => adminToStaff(admin)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.operatorService.login(trimmedEmail, password).pipe(
            map((operator) => operatorToStaff(operator)),
          );
        }
        return throwError(() => error);
      }),
      catchError((error: unknown) =>
        throwError(() => loginError(error, 'Incorrect staff credentials.')),
      ),
    );
  }
}
