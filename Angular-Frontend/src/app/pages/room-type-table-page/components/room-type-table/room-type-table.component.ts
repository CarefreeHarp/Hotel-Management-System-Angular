import { CommonModule } from '@angular/common';
import { Component, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, translate } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { ButtonComponent } from '../../../../components/button/button.component';
import { ListControlsComponent } from '../../../../components/list-controls/list-controls.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { basePath, isAdminArea } from '../../../../utils/base-path';
import {
  ListFilter,
  compareRecords,
  defaultSortOptions,
  initialListState,
  priceMatches,
} from '../../../../utils/list-state';

@Component({
  selector: 'app-room-type-table',
  imports: [
    OptimizedImageDirective,
    CommonModule,
    FormsModule,
    RouterLink,
    ListControlsComponent,
    ButtonComponent,
    TranslocoPipe,
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
  protected readonly deleteSubject = new Subject<number>();
  @Output('delete') readonly delete$ = this.deleteSubject.asObservable();

  listState = initialListState();
  // Las opciones se traducen al crear el componente: la traducción ya está cargada.
  readonly filters: ListFilter[] = [
    {
      key: 'capacity',
      labelKey: 'roomTypes.fields.capacity',
      options: [
        { value: '1-2', label: translate('roomTypes.capacityFilter.small') },
        { value: '3-4', label: translate('roomTypes.capacityFilter.medium') },
        { value: '5+', label: translate('roomTypes.capacityFilter.large') },
      ],
    },
  ];
  readonly sortOptions = [
    ...defaultSortOptions,
    { value: 'price-asc', labelKey: 'list.sort.priceAsc' },
    { value: 'price-desc', labelKey: 'list.sort.priceDesc' },
    { value: 'capacity-asc', labelKey: 'list.sort.capacityAsc' },
    { value: 'capacity-desc', labelKey: 'list.sort.capacityDesc' },
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
        if (sort.startsWith('price-')) {
          return direction * (a.nightlyPrice - b.nightlyPrice);
        }
        if (sort.startsWith('capacity-')) {
          return direction * (a.maxCapacity - b.maxCapacity);
        }
        return compareRecords(sort, a.roomTypeId, b.roomTypeId, a.name, b.name);
      });
  }
}
