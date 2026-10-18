import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PriceRangeComponent } from '../price-range/price-range.component';
import {
  ListFilter,
  ListOption,
  ListState,
  initialListState,
  defaultSortOptions,
} from '../../utils/list-state';
@Component({
  selector: 'app-list-controls',
  imports: [FormsModule, PriceRangeComponent],
  templateUrl: './list-controls.component.html',
  styleUrl: './list-controls.component.scss',
})
export class ListControlsComponent {
  @Input() state: ListState = initialListState();
  @Input() filters: ListFilter[] = [];
  @Input() sortOptions: ListOption[] = defaultSortOptions;
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
  @Output() changed = new EventEmitter<ListState>();
  update(patch: Partial<ListState>): void {
    this.state = { ...this.state, ...patch };
    this.changed.emit(this.state);
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
    this.changed.emit(this.state);
  }
}
