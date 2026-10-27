import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { OptimizedImageDirective } from '../../directives/optimized-image.directive';
import { clientQuery } from '../../utils/client-query';

@Component({
  selector: 'app-footer',
  imports: [OptimizedImageDirective, RouterLink, TranslocoPipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly route = inject(ActivatedRoute);
  // Datos de contacto: se muestran igual en todos los idiomas.
  readonly contactEmail = 'reservations@atlansuites.com';
  readonly contactPhone = '+65 6555 0142';
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
}
