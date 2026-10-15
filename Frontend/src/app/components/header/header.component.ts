import { Component, HostListener, Input, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // La landing lo oculta mientras el video del hotel ocupa toda la pantalla.
  @Input() isHidden = false;
  @Input() solid = false;
  menuOpen = false;
  isScrolled = false;

  get isSolidHeader(): boolean {
    return this.solid || this.isScrolled;
  }

  // Con un cliente en sesión los enlaces llevan su id (/client/:clientId), así
  // la página que abra sigue sabiendo quién es aunque se recargue.
  get base(): string {
    const clientId = this.authService.clientId();
    return clientId === null ? '/' : `/client/${clientId}`;
  }

  // Al cerrar sesión se sale de las páginas protegidas, como el perfil.
  logout(): void {
    this.authService.logout();
    this.closeMenu();
    void this.router.navigate(['/']);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:scroll')
  updateScroll(): void {
    this.isScrolled = window.scrollY > (this.isScrolled ? 4 : 24);
  }

  @HostListener('window:resize')
  closeDesktopMenu(): void {
    if (window.innerWidth >= 1280) this.closeMenu();
  }
}
