import { ButtonComponent } from '../../../../components/button/button.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { ListControlsComponent } from '../../../../components/list-controls/list-controls.component';
import {
  initialListState,
  ListFilter,
  defaultSortOptions,
  priceMatches,
  compareRecords,
} from '../../../../utils/list-state';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { basePath, isAdminArea } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-type-table',
  imports: [
    OptimizedImageDirective,
    CommonModule,
    FormsModule,
    RouterLink,
    ListControlsComponent,
    ButtonComponent,
  ],
  templateUrl: './room-type-table.component.html',
  styleUrl: './room-type-table.component.scss',
})
export class RoomTypeTableComponent {
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
  readonly adminArea = isAdminArea(this.route);

  @Input() roomTypes: RoomTypeListDTO[] = [];
  @Output() delete = new EventEmitter<number>();

  listState = initialListState();
  readonly filters: ListFilter[] = [
    {
      key: 'capacity',
      label: 'Capacity',
      options: [
        { value: '1-2', label: '1–2 guests' },
        { value: '3-4', label: '3–4 guests' },
        { value: '5+', label: '5+ guests' },
      ],
    },
  ];
  readonly sortOptions = [
    ...defaultSortOptions,
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'capacity-asc', label: 'Capacity: low to high' },
    { value: 'capacity-desc', label: 'Capacity: high to low' },
  ];
  get priceFloor(): number {
    return this.roomTypes.length
      ? Math.min(...this.roomTypes.map((item) => item.nightlyPrice))
      : 0;
  }
  get priceLimit(): number {
    return this.roomTypes.length
      ? Math.max(...this.roomTypes.map((item) => item.nightlyPrice))
      : 0;
  }
  resetFilters(): void {
    this.listState = initialListState(this.listState.view);
  }
  get viewMode(): 'table' | 'cards' {
    return this.listState.view;
  }
  get filteredRoomTypes(): RoomTypeListDTO[] {
    const term = this.listState.search.trim().toLowerCase();
    const capacity = this.listState.filters['capacity'];
    return this.roomTypes
      .filter(
        (item) =>
          (!term ||
            [item.name, item.description, String(item.roomTypeId)].some(
              (value) => value.toLowerCase().includes(term),
            )) &&
          priceMatches(item.nightlyPrice, this.listState) &&
          (!capacity ||
            (capacity === '1-2' && item.maxCapacity <= 2) ||
            (capacity === '3-4' &&
              item.maxCapacity >= 3 &&
              item.maxCapacity <= 4) ||
            (capacity === '5+' && item.maxCapacity >= 5)),
      )
      .sort((a, b) => {
        const sort = this.listState.sort;
        const direction = sort.endsWith('-desc') ? -1 : 1;
        if (sort.startsWith('price-'))
          return direction * (a.nightlyPrice - b.nightlyPrice);
        if (sort.startsWith('capacity-'))
          return direction * (a.maxCapacity - b.maxCapacity);
        return compareRecords(sort, a.roomTypeId, b.roomTypeId, a.name, b.name);
      });
  }
}
