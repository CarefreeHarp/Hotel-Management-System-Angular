import { Component, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { ActivationStatus } from '../../models/enums/activation-status';
export interface RecordCard {
  id: number;
  title: string;
  image?: string;
  // labelKey es una clave de traducción. value, el dato ya formateado o traducido.
  details: { labelKey: string; value: string }[];
  detailUrl: string;
  editUrl: string;
  activationStatus?: ActivationStatus;
  canDelete?: boolean;
}
/** Presenta tarjetas recibidas y emite acciones al padre. No consulta ni modifica el backend. */
@Component({
  selector: 'app-record-cards',
  imports: [OptimizedImageDirective, RouterLink, TranslocoPipe],
  templateUrl: './record-cards.component.html',
  styleUrl: './record-cards.component.scss',
})
export class RecordCardsComponent {
  @Input() cards: RecordCard[] = [];
  protected readonly deleteRecordSubject = new Subject<number>();
  @Output('deleteRecord') readonly deleteRecord$ = this.deleteRecordSubject.asObservable();
  protected readonly toggleActivationSubject = new Subject<number>();
  @Output('toggleActivation') readonly toggleActivation$ = this.toggleActivationSubject.asObservable();
}
