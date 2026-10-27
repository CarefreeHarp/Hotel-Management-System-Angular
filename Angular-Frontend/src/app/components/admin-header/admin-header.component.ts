import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { fromEvent } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { basePath } from '../../utils/base-path';

export interface AdminSection {
  // Clave de traducción del enlace.
  labelKey: string;
  path: string;
}

// Secciones administrativas. El operador tiene su tablero como inicio y conserva solo clientes y reservas.
export const ADMIN_SECTIONS: AdminSection[] = [
  { labelKey: 'adminHeader.sections.clients', path: 'clients' },
  { labelKey: 'adminHeader.sections.reservations', path: 'reservations' },
  { labelKey: 'adminHeader.sections.accounting', path: 'accounting' },
  { labelKey: 'adminHeader.sections.roomTypes', path: 'room-types' },
  { labelKey: 'adminHeader.sections.rooms', path: 'rooms' },
  { labelKey: 'adminHeader.sections.services', path: 'services' },
  { labelKey: 'adminHeader.sections.administrators', path: 'administrators' },
  { labelKey: 'adminHeader.sections.operators', path: 'operators' },
];

/**
 * Barra de las páginas de administración. Reemplaza la barra de la landing:
 * los enlaces se arman con la id del administrador que viene en la URL.
 */
@Component({
  selector: 'app-admin-header',
  imports: [OptimizedImageDirective, RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
})
export class AdminHeaderComponent {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isOperator = this.route.snapshot.paramMap.has('operatorId');
  readonly sections = this.isOperator
    ? ADMIN_SECTIONS.filter(
      (section) =>
        section.path === 'clients' || section.path === 'reservations',
    )
    : ADMIN_SECTIONS;
  get base(): string {
    return basePath(this.route);
  }
  get adminId(): string | null {
    return this.route.snapshot.paramMap.get('adminId');
  }
  get operatorId(): string | null {
    return this.route.snapshot.paramMap.get('operatorId');
  }
  menuOpen = false;

  constructor() {
    fromEvent(window, 'resize').pipe(takeUntilDestroyed()).subscribe(() => this.closeDesktopMenu());
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    void this.router.navigate(['/']);
  }
  closeDesktopMenu(): void {
    if (window.innerWidth > 1440) {
      this.closeMenu();
    }
  }
}
