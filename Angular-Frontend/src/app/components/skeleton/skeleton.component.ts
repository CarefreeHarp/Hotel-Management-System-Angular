import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-skeleton',
  imports: [TranslocoPipe],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  @Input() variant: 'table' | 'cards' | 'form' | 'detail' | 'stat' = 'detail';
  // Texto ya traducido. Sin valor se anuncia el mensaje genérico de carga.
  @Input() label = '';
  readonly rows = [0, 1, 2, 3, 4];
  readonly cards = [0, 1, 2];
}
