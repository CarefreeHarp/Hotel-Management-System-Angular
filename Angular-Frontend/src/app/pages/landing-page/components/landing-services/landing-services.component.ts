import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceService } from '../../../../services/service.service';
import { ServiceCatalogDTO } from '../../../../models/dto/service-catalog-dto';
import { clientQuery } from '../../../../utils/client-query';
import { ServiceCardComponent } from './components/service-card/service-card.component';
@Component({
  selector: 'app-landing-services',
  imports: [OptimizedImageDirective, RouterLink, ServiceCardComponent],
  templateUrl: './landing-services.component.html',
  styleUrl: './landing-services.component.scss',
})
export class LandingServicesComponent implements OnInit {
  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  services: ServiceCatalogDTO[] = [];
  loading = true;
  error = '';
  index = 0;
  visibleCount = this.count();
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
    this.service.getCatalog().subscribe({
      next: (items) => {
        this.services = items;
        this.loading = false;
      },
      error: () => {
        this.error = 'Services could not be loaded.';
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
  @HostListener('window:resize') resize(): void {
    this.visibleCount = this.count();
    this.index = Math.min(this.index, this.maxIndex);
  }
  private count(): number {
    return window.matchMedia('(min-width:1280px)').matches
      ? 4
      : window.matchMedia('(min-width:640px)').matches
        ? 2
        : 1;
  }
}
