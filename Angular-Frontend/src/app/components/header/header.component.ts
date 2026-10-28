import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, fromEvent, of, switchMap } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ClientService } from '../../services/client.service';
import { clientQuery } from '../../utils/client-query';
import { HeaderMenuComponent, MenuLink } from './components/header-menu/header-menu.component';

// Enlaces del menú lateral del sitio público. Todos conservan auth (ver authParams).
const MENU_LINKS: MenuLink[] = [
  { labelKey: 'header.nav.home', path: '/' },
  { labelKey: 'header.nav.hotel', path: '/', fragment: 'video-section' },
  { labelKey: 'header.nav.suites', path: '/', fragment: 'rooms-section' },
  { labelKey: 'header.nav.services', path: '/', fragment: 'services-section' },
  { labelKey: 'header.nav.catalog', path: '/services-catalog', highlight: true },
];

@Component({
  selector: 'app-header',
  imports: [
    OptimizedImageDirective,
    RouterLink,
    AsyncPipe,
    NgTemplateOutlet,
    HeaderMenuComponent,
    TranslocoPipe,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly clients = inject(ClientService);
  readonly client$ = this.route.queryParamMap.pipe(
    // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
    switchMap(() => {
      const id = clientQuery(this.route).auth;
      return id === undefined
        ? of(undefined)
        : this.clients.getById(id).pipe(catchError(() => of(undefined)));
    }),
  );
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly router = inject(Router);
  readonly menuLinks = MENU_LINKS;

  // La landing lo oculta mientras el video del hotel ocupa toda la pantalla.
  @Input() isHidden = false;
  @Input() solid = false;
  compactHeader = window.innerWidth < 1100;
  isScrolled = false;

  constructor() {
    fromEvent(window, 'scroll').pipe(takeUntilDestroyed()).subscribe(() => this.updateScroll());
    fromEvent(window, 'resize').pipe(takeUntilDestroyed()).subscribe(() => this.updateHeaderLayout());
  }

  get isSolidHeader(): boolean {
    return this.solid || this.isScrolled;
  }

  logout(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { auth: null },
      queryParamsHandling: 'merge',
    });
  }
  // Dos umbrales evitan alternar el estado continuamente cerca del punto de cambio.
  updateScroll(): void {
    this.isScrolled = window.scrollY > (this.isScrolled ? 24 : 80);
  }
  updateHeaderLayout(): void {
    this.compactHeader = window.innerWidth < 1100;
  }
}
