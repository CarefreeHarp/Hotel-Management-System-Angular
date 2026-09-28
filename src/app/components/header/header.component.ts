import { Component, HostListener, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // La landing lo oculta mientras el video del hotel ocupa toda la pantalla.
  @Input() isHidden = false;
  menuOpen = false;
  isScrolled = false;

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
