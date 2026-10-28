import { NgTemplateOutlet } from '@angular/common';
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
import { HeaderMenuComponent, MenuLink } from '../header/components/header-menu/header-menu.component';

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

// Ancho de ventana desde el que la barra de secciones cabe en todos los idiomas. Los más largos
// necesitan unos 1860 px en el área del administrador (francés) y 1100 px en la del operador (ruso).
// Con menos ancho, las secciones se abren desde el botón Menú.
const SECTIONS_BAR_MIN_WIDTH = { admin: 1900, operator: 1200 };
// Igual que en la barra pública: por debajo, las acciones de la cuenta también pasan al menú lateral.
const COMPACT_WIDTH = 1100;

/**
 * Barra de las páginas de administración. Reemplaza la barra de la landing:
 * los enlaces se arman con la id del administrador que viene en la URL.
 * Tiene el mismo menú lateral que el sitio público, con el selector de idioma.
 */
@Component({
  selector: 'app-admin-header',
  imports: [
    NgTemplateOutlet,
    OptimizedImageDirective,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    HeaderMenuComponent,
  ],
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
  // Inicio del área (panel o tablero) y sus secciones. Los muestran la barra de secciones y el menú lateral.
  get menuLinks(): MenuLink[] {
    return [
      {
        labelKey: this.isOperator ? 'adminHeader.frontDesk' : 'adminHeader.adminPanel',
        path: this.base,
        highlight: true,
        exact: true,
      },
      ...this.sections.map((section) => ({
        labelKey: section.labelKey,
        path: `${this.base}/${section.path}`,
        highlight: true,
      })),
    ];
  }
  private readonly sectionsBarMinWidth = this.isOperator
    ? SECTIONS_BAR_MIN_WIDTH.operator
    : SECTIONS_BAR_MIN_WIDTH.admin;
  showSectionsBar = window.innerWidth >= this.sectionsBarMinWidth;
  compactHeader = window.innerWidth < COMPACT_WIDTH;

  constructor() {
    fromEvent(window, 'resize').pipe(takeUntilDestroyed()).subscribe(() => this.updateHeaderLayout());
  }

  logout(): void {
    void this.router.navigate(['/']);
  }
  updateHeaderLayout(): void {
    this.showSectionsBar = window.innerWidth >= this.sectionsBarMinWidth;
    this.compactHeader = window.innerWidth < COMPACT_WIDTH;
  }
}
