import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, HostListener, Input, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { HeaderMenuComponent } from './components/header-menu/header-menu.component';
import { switchMap, of, catchError } from 'rxjs';
import { ClientService } from '../../services/client.service';
import { clientQuery } from '../../utils/client-query';

@Component({
  selector: 'app-header',
  imports: [
    OptimizedImageDirective,
    RouterLink,
    AsyncPipe,
    NgTemplateOutlet,
    HeaderMenuComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clients = inject(ClientService);
  readonly client$ = this.route.queryParamMap.pipe(
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

  // La landing lo oculta mientras el video del hotel ocupa toda la pantalla.
  @Input() isHidden = false;
  @Input() solid = false;
  compactHeader = window.innerWidth < 1100;
  isScrolled = false;

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

  @HostListener('window:scroll')
  updateScroll(): void {
    this.isScrolled = window.scrollY > (this.isScrolled ? 24 : 80);
  }

  @HostListener('window:resize')
  updateHeaderLayout(): void {
    this.compactHeader = window.innerWidth < 1100;
  }
}
