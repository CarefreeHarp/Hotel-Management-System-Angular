import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  imports: [],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  @Input() variant: 'table' | 'cards' | 'form' | 'detail' | 'stat' = 'detail';
  @Input() label = 'Loading content...';
  readonly rows = [0, 1, 2, 3, 4];
  readonly cards = [0, 1, 2];
}
