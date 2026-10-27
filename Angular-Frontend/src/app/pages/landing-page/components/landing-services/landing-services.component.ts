import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { fromEvent } from 'rxjs';
import { SkeletonComponent } from '../../../../components/skeleton/skeleton.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { ServiceCatalogDTO } from '../../../../models/dto/service-catalog-dto';
import { ServiceService } from '../../../../services/service.service';
import { clientQuery } from '../../../../utils/client-query';
import { ServiceCardComponent } from './components/service-card/service-card.component';
@Component({
  selector: 'app-landing-services',
  imports: [
    SkeletonComponent,
    OptimizedImageDirective,
    RouterLink,
    ServiceCardComponent,
    TranslocoPipe,
  ],
  templateUrl: './landing-services.component.html',
  styleUrl: './landing-services.component.scss',
})
export class LandingServicesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  services: ServiceCatalogDTO[] = [];
  loading = true;
  // Clave de traducción del aviso de error de la sección.
  error = '';
  index = 0;
  visibleCount = this.count();

  constructor() {
    fromEvent(window, 'resize').pipe(takeUntilDestroyed()).subscribe(() => this.resize());
  }
  get featured(): ServiceCatalogDTO | undefined {
    return this.services[0];
  }
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  get maxIndex(): number {
    return Math.max(0, this.services.length - this.visibleCount);
  }
  get transform(): string {
    return `translateX(calc(-${this.index} * (100% + 1.5rem) / ${this.visibleCount}))`;
  }
  ngOnInit(): void {
    this.service.getCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.services = items;
        this.loading = false;
      },
      error: () => {
        this.error = 'landing.services.loadError';
        this.loading = false;
      },
    });
  }
  previous(): void {
    this.index = Math.max(0, this.index - 1);
  }
  next(): void {
    this.index = Math.min(this.maxIndex, this.index + 1);
  }
  resize(): void {
    this.visibleCount = this.count();
    this.index = Math.min(this.index, this.maxIndex);
  }
  private count(): number {
    if (window.matchMedia('(min-width:1280px)').matches) {
      return 4;
    }
    if (window.matchMedia('(min-width:640px)').matches) {
      return 2;
    }
    return 1;
  }
}
