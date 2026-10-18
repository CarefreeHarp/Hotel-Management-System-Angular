import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  Input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss',
})
export class HeaderMenuComponent implements OnDestroy {
  @Input({ required: true }) authParams: { auth?: number } = {};
  @ViewChild('drawer') private drawer?: ElementRef<HTMLDialogElement>;
  private readonly document = inject(DOCUMENT);
  private previousOverflow: string | undefined;
  isOpen = false;
  isClosing = false;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  open(): void {
    const dialog = this.drawer?.nativeElement;
    if (!dialog || dialog.open) return;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    dialog.showModal();
    this.isOpen = true;
  }

  close(): void {
    if (!this.drawer?.nativeElement.open || this.isClosing) return;
    this.isClosing = true;
    if (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
        .matches
    ) {
      this.finishClose();
      return;
    }
    // Respaldo si el navegador interrumpe la transición antes de emitir transitionend.
    this.closeTimer = setTimeout(() => this.finishClose(), 350);
  }

  finishClose(event?: TransitionEvent): void {
    if (
      event &&
      (event.target !== this.drawer?.nativeElement ||
        event.propertyName !== 'transform')
    )
      return;
    if (!this.isClosing) return;
    this.drawer?.nativeElement.close();
    this.resetState();
  }

  resetState(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
    this.isClosing = false;
    this.isOpen = false;
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
    )
      this.close();
  }

  ngOnDestroy(): void {
    this.drawer?.nativeElement.close();
    this.resetState();
  }
}
