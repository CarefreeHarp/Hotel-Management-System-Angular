import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { BookingQuote } from '../../../../models/booking';
import { ServiceCatalogDTO } from '../../../../models/dto/service-catalog-dto';
/** Mantiene la selección local y emite sus identificadores al paso padre, sin guardar la reserva. */
@Component({
  selector: 'app-booking-services',
  imports: [OptimizedImageDirective, CurrencyPipe, AsyncPipe],
  templateUrl: './booking-services.component.html',
  styleUrl: './booking-services.component.scss',
})
export class BookingServicesComponent {
  @Input({ required: true }) quote: BookingQuote | undefined;
  // BehaviorSubject guarda el valor actual. next avisa a la vista cuando cambia.
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
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly selectedSubject = new Subject<number[]>();
  @Output('selected') readonly selected$ = this.selectedSubject.asObservable();
  // combineLatest recalcula la vista con los últimos datos y filtros, sin repetir la consulta HTTP.
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
      const categories: string[] = [];
      for (const service of services) {
        if (!categories.includes(service.category)) categories.push(service.category);
      }
      let total = 0;
      for (const service of cart) total += service.price;
      return {
        ids,
        category,
        page,
        filtered,
        pageSize,
        cart,
        categories: ['all', ...categories],
        visible: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total,
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
