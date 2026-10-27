import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';

@Component({
  selector: 'app-hero',
  imports: [OptimizedImageDirective, TranslocoPipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  // La marca se muestra igual en todos los idiomas.
  hotelName: string = 'Atlan Suites';

  scrollToHotel(): void {
    document
      .getElementById('video-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}
