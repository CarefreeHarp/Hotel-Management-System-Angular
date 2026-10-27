import { AfterViewInit, Component, ElementRef, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { ButtonComponent } from '../../../../components/button/button.component';

/** Confirma la cancelación con texto exacto. El diálogo nativo limita el foco y permite salir con Escape. */
@Component({
  selector: 'app-reservation-cancel-dialog',
  imports: [ButtonComponent, FormsModule, TranslocoPipe],
  templateUrl: './reservation-cancel-dialog.component.html',
  styleUrl: './reservation-cancel-dialog.component.scss',
})
export class ReservationCancelDialogComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) reservationCode = '';
  @Input() busy = false;
  @Input() errorMessage = '';
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;
  private readonly confirmedSubject = new Subject<void>();
  private readonly dismissedSubject = new Subject<void>();
  @Output() readonly confirmed = this.confirmedSubject.asObservable();
  @Output() readonly dismissed = this.dismissedSubject.asObservable();
  // La frase cambia con el idioma. se traduce al crear el diálogo.
  readonly confirmationPhrase = translate('profile.cancel.phrase');
  confirmationText = '';

  ngAfterViewInit(): void {
    this.dialog?.nativeElement.showModal();
  }

  confirmCancellation(): void {
    // También comprueba los envíos con Enter. No acepta espacios extra ni cambios de mayúsculas.
    if (this.busy || this.confirmationText !== this.confirmationPhrase) {
      return;
    }
    this.confirmedSubject.next();
  }

  dismiss(event?: Event): void {
    event?.preventDefault();
    if (this.busy) {
      return;
    }
    this.dialog?.nativeElement.close();
    this.dismissedSubject.next();
  }

  ngOnDestroy(): void {
    // Cerrar antes de retirar el diálogo permite que el navegador restituya el foco.
    this.dialog?.nativeElement.close();
    this.confirmedSubject.complete();
    this.dismissedSubject.complete();
  }
}
