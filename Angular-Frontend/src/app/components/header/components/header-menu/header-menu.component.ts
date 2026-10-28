import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject, switchMap, takeUntil, timer } from 'rxjs';
import { AppLanguage, changeLanguage, LANGUAGES, savedLanguage } from '../../../../utils/language';

/** Enlace del menú lateral. El sitio público y las áreas del personal pasan cada uno los suyos. */
export interface MenuLink {
  // Clave de traducción del texto.
  labelKey: string;
  path: string;
  // Sección de la landing. Sin ella, RouterLink recibe undefined y arma la URL sin "#"
  // (con exactOptionalPropertyTypes su tipo no lo admite, por eso la plantilla usa $any).
  fragment?: string;
  // Marca el enlace mientras se está en su página. Los que llevan a secciones de la landing no se marcan.
  highlight?: boolean;
  // Solo en esa dirección: el inicio de un área no queda marcado en todas sus secciones.
  exact?: boolean;
}

@Component({
  selector: 'app-header-menu',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss',
})
export class HeaderMenuComponent implements OnDestroy {
  @Input({ required: true }) links: MenuLink[] = [];
  // Parámetros que conservan todos los enlaces: en el sitio público, auth del cliente.
  @Input() queryParams: Params = {};
  @ViewChild('drawer') private drawer?: ElementRef<HTMLDialogElement>;
  private readonly document = inject(DOCUMENT);
  private previousOverflow: string | undefined;
  isOpen = false;
  isClosing = false;
  readonly languages = LANGUAGES;
  // Idioma con el que arrancó la aplicación: es el que se marca como actual en la lista.
  readonly currentLanguage = savedLanguage();
  languagesOpen = false;
  private readonly closeSubject = new Subject<void>();
  private readonly cancelCloseSubject = new Subject<void>();

  constructor() {
    // Cada cierre inicia su respaldo. La transición o un reinicio pueden cancelar esa espera.
    this.closeSubject.pipe(
      switchMap(() => timer(350).pipe(takeUntil(this.cancelCloseSubject))),
      takeUntilDestroyed(),
    ).subscribe(() => this.finishClose());
  }

  open(): void {
    const dialog = this.drawer?.nativeElement;
    if (!dialog || dialog.open) {
      return;
    }
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    dialog.showModal();
    this.isOpen = true;
  }

  close(): void {
    if (!this.drawer?.nativeElement.open || this.isClosing) {
      return;
    }
    this.isClosing = true;
    if (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
        .matches
    ) {
      this.finishClose();
      return;
    }
    // Respaldo si el navegador interrumpe la transición antes de emitir transitionend.
    this.closeSubject.next();
  }

  finishClose(event?: TransitionEvent): void {
    if (
      event &&
      (event.target !== this.drawer?.nativeElement ||
        event.propertyName !== 'transform')
    ) {
      return;
    }
    if (!this.isClosing) {
      return;
    }
    this.drawer?.nativeElement.close();
    this.resetState();
  }

  // Elegir otro idioma lo guarda y recarga la página. El idioma actual solo cierra la lista.
  selectLanguage(language: AppLanguage): void {
    if (language.code === this.currentLanguage.code) {
      this.languagesOpen = false;
      return;
    }
    changeLanguage(language.code);
  }

  resetState(): void {
    this.cancelCloseSubject.next();
    this.isClosing = false;
    this.isOpen = false;
    this.languagesOpen = false;
    if (this.previousOverflow !== undefined) {
      this.document.body.style.overflow = this.previousOverflow;
      this.previousOverflow = undefined;
    }
  }

  closeFromBackdrop(event: MouseEvent): void {
    const bounds = this.drawer?.nativeElement.getBoundingClientRect();
    if (
      bounds &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    ) {
      this.close();
    }
  }

  ngOnDestroy(): void {
    this.drawer?.nativeElement.close();
    this.resetState();
  }
}
