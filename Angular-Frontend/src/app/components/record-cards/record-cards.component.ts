import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
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
@Component({
  selector: 'app-record-cards',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './record-cards.component.html',
  styleUrl: './record-cards.component.scss',
})
export class RecordCardsComponent {
  @Input() cards: RecordCard[] = [];
  @Output() deleteRecord = new EventEmitter<number>();
  @Output() toggleActivation = new EventEmitter<number>();
}
