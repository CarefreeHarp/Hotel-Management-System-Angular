import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { ButtonComponent } from '../../../../components/button/button.component';

/** Pide confirmación antes del borrado. El diálogo nativo limita el foco y permite cancelar con Escape. */
@Component({
  selector: 'app-reservation-delete-dialog',
  imports: [ButtonComponent],
  templateUrl: './reservation-delete-dialog.component.html',
  styleUrl: './reservation-delete-dialog.component.scss',
})
export class ReservationDeleteDialogComponent implements AfterViewInit {
  readonly reservationId = input.required<number>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  ngAfterViewInit(): void {
    // showModal bloquea la interacción con el fondo. Cancelar recibe el foco inicial.
    this.dialog().nativeElement.showModal();
  }

  confirmDeletion(): void {
    this.dialog().nativeElement.close();
    this.confirmed.emit();
  }

  cancelDeletion(event?: Event): void {
    event?.preventDefault();
    // Cerrar antes de retirar el componente devuelve el foco al botón que abrió la ventana.
    this.dialog().nativeElement.close();
    this.cancelled.emit();
  }
}
