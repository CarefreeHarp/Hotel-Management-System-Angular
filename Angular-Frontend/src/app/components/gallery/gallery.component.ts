import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';

@Component({
  imports: [OptimizedImageDirective, TranslocoPipe],
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) photos: string[] = [];
}
