import { Component, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import {
  ListFilter,
  ListState,
  SortOption,
  defaultSortOptions,
  initialListState,
} from '../../utils/list-state';
import { PriceRangeComponent } from '../price-range/price-range.component';
/** Recibe los filtros y emite el estado elegido. La página decide cómo aplicarlo a sus registros. */
@Component({
  selector: 'app-list-controls',
  imports: [FormsModule, PriceRangeComponent, TranslocoPipe],
  templateUrl: './list-controls.component.html',
  styleUrl: './list-controls.component.scss',
})
export class ListControlsComponent {
  @Input() state: ListState = initialListState();
  @Input() filters: ListFilter[] = [];
  @Input() sortOptions: SortOption[] = defaultSortOptions;
  @Input() priceFloor = 0;
  @Input() priceLimit = 0;
  @Input() count = 0;
  get minimumPrice(): number {
    return Number(this.state.filters['minPrice'] ?? this.priceFloor);
  }
  get maximumPrice(): number {
    return Number(this.state.filters['maxPrice'] ?? this.priceLimit);
  }
  prices(range: { minimum: number; maximum: number }): void {
    this.update({
      filters: {
        ...this.state.filters,
        minPrice: String(range.minimum),
        maxPrice: String(range.maximum),
      },
    });
  }
  @Input() total = 0;
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly changedSubject = new Subject<ListState>();
  @Output('changed') readonly changed$ = this.changedSubject.asObservable();
  update(patch: Partial<ListState>): void {
    this.state = { ...this.state, ...patch };
    this.changedSubject.next(this.state);
  }
  filter(key: string, value: string | number | null): void {
    this.update({
      filters: {
        ...this.state.filters,
        [key]: value === null ? '' : String(value),
      },
    });
  }
  reset(): void {
    this.state = initialListState(this.state.view);
    this.changedSubject.next(this.state);
  }
}
