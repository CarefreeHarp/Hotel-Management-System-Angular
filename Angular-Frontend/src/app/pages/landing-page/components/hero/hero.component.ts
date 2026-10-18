import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [OptimizedImageDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  hotelName: string = 'Atlan Suites';
  location: string = 'Singapore';

  scrollToHotel(): void {
    document
      .getElementById('video-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}
