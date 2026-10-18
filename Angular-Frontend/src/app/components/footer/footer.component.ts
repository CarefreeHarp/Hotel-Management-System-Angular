import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { clientQuery } from '../../utils/client-query';

@Component({
  selector: 'app-footer',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly route = inject(ActivatedRoute);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
}
