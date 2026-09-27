import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
