import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, HostListener, inject } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { basePath } from '../../utils/base-path';

export interface AdminSection {
  label: string;
  path: string;
}

// Secciones de la barra, en el mismo orden que el admin-shell de la aplicación de Thymeleaf.
export const ADMIN_SECTIONS: AdminSection[] = [
  { label: 'Clients', path: 'clients' },
  { label: 'Reservations', path: 'reservations' },
  { label: 'Room types', path: 'room-types' },
  { label: 'Rooms', path: 'rooms' },
  { label: 'Services', path: 'services' },
  { label: 'Administrators', path: 'administrators' },
  { label: 'Operators', path: 'operators' },
];

/**
 * Barra de las páginas de administración. Reemplaza la barra de la landing:
 * los enlaces se arman con la id del administrador que viene en la URL.
 */
@Component({
  selector: 'app-admin-header',
  imports: [OptimizedImageDirective, RouterLink, RouterLinkActive],
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

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    void this.router.navigate(['/']);
  }

  @HostListener('window:resize')
  closeDesktopMenu(): void {
    if (window.innerWidth > 1180) this.closeMenu();
  }
}
