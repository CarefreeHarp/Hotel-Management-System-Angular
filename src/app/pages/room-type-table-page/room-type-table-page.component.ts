import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { RoomTypeTableComponent } from './components/room-type-table/room-type-table.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomType } from '../../models/room-type';

@Component({
  selector: 'app-room-type-table-page',
  imports: [
    CommonModule,
    HeaderComponent,
    PageTitleComponent,
    RoomTypeTableComponent,
  ],
  templateUrl: './room-type-table-page.component.html',
  styleUrl: './room-type-table-page.component.scss',
})
export class RoomTypeTablePageComponent implements OnInit {
  private roomTypeService = inject(RoomTypeService);

  roomTypes: RoomType[] = [];
  toastMessage: string | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.roomTypes = this.roomTypeService.getAll();
  }

  get totalCount(): number {
    return this.roomTypes.length;
  }

  get avgPrice(): number {
    if (this.roomTypes.length === 0) return 0;
    const sum = this.roomTypes.reduce(
      (acc, curr) => acc + curr.nightlyPrice,
      0,
    );
    return Math.round(sum / this.roomTypes.length);
  }

  get maxCapacity(): number {
    if (this.roomTypes.length === 0) return 0;
    return Math.max(...this.roomTypes.map((rt) => rt.maxCapacity));
  }

  get minCapacity(): number {
    if (this.roomTypes.length === 0) return 0;
    return Math.min(...this.roomTypes.map((rt) => rt.maxCapacity));
  }

  handleDelete(id: number): void {
    const deletedItem = this.roomTypeService.getById(id);
    this.roomTypeService.delete(id);
    this.loadRoomTypes();
    this.triggerToast(
      `Room type "${deletedItem?.name || id}" was successfully removed.`,
    );
  }

  triggerToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }

  dismissToast(): void {
    this.toastMessage = null;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
}
