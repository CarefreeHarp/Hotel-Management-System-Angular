import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomType } from '../../../../models/room-type';

@Component({
  selector: 'app-room-type-table',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './room-type-table.component.html',
  styleUrl: './room-type-table.component.scss'
})
export class RoomTypeTableComponent {
  @Input() roomTypes: RoomType[] = [];
  @Output() delete = new EventEmitter<number>();

  searchTerm = '';
  selectedCapacity = 'all';
  sortBy = 'id-asc';
  viewMode: 'table' | 'cards' = 'table';

  roomTypeToDelete: RoomType | null = null;

  get filteredRoomTypes(): RoomType[] {
    let result = [...this.roomTypes];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (rt) =>
          rt.name.toLowerCase().includes(term) ||
          rt.description.toLowerCase().includes(term) ||
          rt.roomTypeId.toString().includes(term)
      );
    }

    // Capacity filter
    if (this.selectedCapacity === '1-2') {
      result = result.filter((rt) => rt.maxCapacity <= 2);
    } else if (this.selectedCapacity === '3-4') {
      result = result.filter((rt) => rt.maxCapacity >= 3 && rt.maxCapacity <= 4);
    } else if (this.selectedCapacity === '5+') {
      result = result.filter((rt) => rt.maxCapacity >= 5);
    }

    // Sorting
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.nightlyPrice - b.nightlyPrice;
        case 'price-desc':
          return b.nightlyPrice - a.nightlyPrice;
        case 'capacity-desc':
          return b.maxCapacity - a.maxCapacity;
        case 'id-asc':
        default:
          return a.roomTypeId - b.roomTypeId;
      }
    });

    return result;
  }

  promptDelete(roomType: RoomType): void {
    this.roomTypeToDelete = roomType;
  }

  cancelDelete(): void {
    this.roomTypeToDelete = null;
  }

  confirmDelete(): void {
    if (this.roomTypeToDelete) {
      this.delete.emit(this.roomTypeToDelete.roomTypeId);
      this.roomTypeToDelete = null;
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCapacity = 'all';
    this.sortBy = 'id-asc';
  }
}
