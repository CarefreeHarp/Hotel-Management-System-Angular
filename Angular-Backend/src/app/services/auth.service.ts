import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
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

// La sesión guarda los DTO que devuelve el backend: nunca contiene contraseñas.
export interface AuthSession {
  role: UserRole;
  client?: ClientDetailDTO;
  staff?: StaffUser;
}

function adminToStaff(admin: AdministratorDTO): StaffUser {
  return { id: admin.adminId, name: admin.name, email: admin.email, role: 'ADMINISTRATOR' };
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

  // La sesión solo vive en la memoria de esta pestaña: no se guarda nada en el
  // navegador. Al recargar se pierde, pero la URL trae la id (/client/:clientId o
  // /admin/:adminId) y los guards la vuelven a abrir pidiendo ese usuario al backend.
  private readonly sessionSignal = signal<AuthSession | null>(null);
  // Después de cerrar sesión, el botón Atrás no debe reabrirla con la URL anterior.
  private loggedOut = false;

  readonly session = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.sessionSignal() !== null);
  readonly currentRole = computed(() => this.sessionSignal()?.role ?? null);
  readonly isClient = computed(() => this.sessionSignal()?.role === 'CLIENT');
  readonly isStaff = computed(
    () => this.sessionSignal()?.role === 'ADMINISTRATOR' || this.sessionSignal()?.role === 'OPERATOR',
  );
  readonly isAdmin = computed(() => this.sessionSignal()?.role === 'ADMINISTRATOR');
  readonly isOperator = computed(() => this.sessionSignal()?.role === 'OPERATOR');
  readonly clientId = computed(() => this.sessionSignal()?.client?.clientId ?? null);
  readonly adminId = computed(() => (this.isAdmin() ? (this.sessionSignal()?.staff?.id ?? null) : null));

  /** Página propia de cada rol: ahí se devuelve a quien intenta abrir la URL de otro usuario. */
  readonly homeUrl = computed(() => {
    const clientId = this.clientId();
    if (clientId !== null) return `/client/${clientId}/profile`;
    const adminId = this.adminId();
    if (adminId !== null) return `/admin/${adminId}`;
    const session = this.sessionSignal();
    if(session?.role==='OPERATOR' && session.staff) return `/operator/${session.staff.id}`;
    return '/';
  });

  readonly currentUser = computed(() => {
    const s = this.sessionSignal();
    if (!s) return null;
    return s.role === 'CLIENT' ? s.client : s.staff;
  });

  readonly displayName = computed(() => {
    const s = this.sessionSignal();
    if (!s) return '';
    if (s.role === 'CLIENT' && s.client) {
      return `${s.client.name} ${s.client.lastName}`;
    }
    if (s.staff) {
      return s.staff.lastName ? `${s.staff.name} ${s.staff.lastName}` : s.staff.name;
    }
    return '';
  });

  private setSession(session: AuthSession | null): void {
    this.sessionSignal.set(session);
    if (session) this.loggedOut = false;
  }

  hasLoggedOut(): boolean {
    return this.loggedOut;
  }

  /** Abre la sesión del cliente que el guard trajo del backend con la id de la URL. */
  openClientSession(client: ClientDetailDTO): void {
    this.setSession({ role: 'CLIENT', client });
  }

  /** Abre la sesión del administrador que el guard trajo del backend con la id de la URL. */
  openAdminSession(admin: AdministratorDTO): void {
    this.setSession({ role: 'ADMINISTRATOR', staff: adminToStaff(admin) });
  }

  openOperatorSession(operator: OperatorDTO): void {
    this.setSession({role:'OPERATOR',staff:operatorToStaff(operator)});
  }

  /** Actualiza los datos del cliente en sesión después de editar su perfil. */
  updateClient(client: ClientDetailDTO): void {
    const session = this.sessionSignal();
    if (session?.role === 'CLIENT') {
      this.setSession({ ...session, client });
    }
  }

  /**
   * Inicia sesión para clientes. El backend busca el correo, valida la contraseña
   * y devuelve el cliente; su id es la que va en la URL del perfil.
   */
  loginClient(email: string, password: string): Observable<ClientDetailDTO> {
    return this.clientService.login(email.trim(), password).pipe(
      catchError(() => throwError(() => new Error('Incorrect email or password.'))),
      map((client) => {
        this.openClientSession(client);
        return client;
      }),
    );
  }

  /**
   * Registra un nuevo cliente en el backend y lo autentica inmediatamente. El
   * backend revisa que el correo y el documento no estén registrados.
   */
  registerClient(clientData: Omit<Client, 'clientId'>): Observable<ClientDetailDTO> {
    return this.clientService.add(clientData).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(error.error?.message || 'Guest registration failed.')),
      ),
      mergeMap(() => this.loginClient(clientData.email, clientData.password)),
    );
  }

  /**
   * Inicia sesión para staff: primero se prueba como administrador y, si el
   * backend lo rechaza, como operador.
   */
  loginStaff(email: string, password: string): Observable<StaffUser> {
    const trimmedEmail = email.trim();

    return this.adminService.login(trimmedEmail, password).pipe(
      map((admin) => adminToStaff(admin)),
      catchError(() =>
        this.operatorService.login(trimmedEmail, password).pipe(map((operator) => operatorToStaff(operator))),
      ),
      catchError(() => throwError(() => new Error('Incorrect staff credentials.'))),
      map((staff) => {
        this.setSession({ role: staff.role, staff });
        return staff;
      }),
    );
  }

  logout(): void {
    this.setSession(null);
    this.loggedOut = true;
  }
}
