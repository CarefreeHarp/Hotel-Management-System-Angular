import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, Input } from '@angular/core';

@Component({
  imports: [OptimizedImageDirective],
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) photos: string[] = [];
}
