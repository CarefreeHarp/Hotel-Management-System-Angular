import { Component, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ActivationStatus } from '../../models/enums/activation-status';
export interface RecordCard {
  id: number;
  title: string;
  image?: string;
  details: { label: string; value: string }[];
  detailUrl: string;
  editUrl: string;
  activationStatus?: ActivationStatus;
  canDelete?: boolean;
}
/** Presenta tarjetas recibidas y emite acciones al padre. No consulta ni modifica el backend. */
@Component({
  selector: 'app-record-cards',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './record-cards.component.html',
  styleUrl: './record-cards.component.scss',
})
export class RecordCardsComponent {
  @Input() cards: RecordCard[] = [];
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly deleteRecordSubject = new Subject<number>();
  @Output('deleteRecord') readonly deleteRecord$ = this.deleteRecordSubject.asObservable();
  protected readonly toggleActivationSubject = new Subject<number>();
  @Output('toggleActivation') readonly toggleActivation$ = this.toggleActivationSubject.asObservable();
}
