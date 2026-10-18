import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, Input, output } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { BookingQuote } from '../../../../models/booking';
import { ServiceCatalogDTO } from '../../../../models/dto/service-catalog-dto';
@Component({
  selector: 'app-booking-services',
  imports: [OptimizedImageDirective, CurrencyPipe, AsyncPipe],
  templateUrl: './booking-services.component.html',
  styleUrl: './booking-services.component.scss',
})
export class BookingServicesComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
  private readonly servicesSubject = new BehaviorSubject<ServiceCatalogDTO[]>(
    [],
  );
  private readonly idsSubject = new BehaviorSubject<number[]>([]);
  private readonly categorySubject = new BehaviorSubject('all');
  private readonly pageSubject = new BehaviorSubject(0);
  @Input({ required: true }) set services(value: ServiceCatalogDTO[]) {
    this.servicesSubject.next(value);
  }
  @Input({ required: true }) set initialIds(value: number[]) {
    this.idsSubject.next([...value]);
  }
  readonly selected = output<number[]>();
  readonly state$ = combineLatest([
    this.servicesSubject,
    this.idsSubject,
    this.categorySubject,
    this.pageSubject,
  ]).pipe(
    map(([services, ids, category, page]) => {
      const filtered = services.filter(
        (service) => category === 'all' || service.category === category,
      );
      const pageSize = Math.max(1, Math.ceil(filtered.length / 2));
      const cart = services.filter((service) =>
        ids.includes(service.serviceId),
      );
      return {
        ids,
        category,
        page,
        filtered,
        pageSize,
        cart,
        categories: [
          'all',
          ...new Set(services.map((service) => service.category)),
        ],
        visible: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total: cart.reduce((sum, service) => sum + service.price, 0),
      };
    }),
  );
  filter(value: string): void {
    this.pageSubject.next(0);
    this.categorySubject.next(value);
  }
  changePage(value: number): void {
    this.pageSubject.next(value);
  }
  clear(): void {
    this.idsSubject.next([]);
  }
  add(id: number): void {
    const ids = this.idsSubject.value;
    if (!ids.includes(id)) this.idsSubject.next([...ids, id]);
  }
  remove(id: number): void {
    this.idsSubject.next(this.idsSubject.value.filter((value) => value !== id));
  }
}
