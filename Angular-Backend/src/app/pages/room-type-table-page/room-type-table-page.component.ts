import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { RoomTypeTableComponent } from './components/room-type-table/room-type-table.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomTypeListDTO } from '../../models/dto/room-type-list-dto';
import { isAdminArea } from '../../utils/base-path';

@Component({
  selector: 'app-room-type-table-page',
  imports: [
    CommonModule,
    HeaderComponent,
    AdminHeaderComponent,
    PageTitleComponent,
    RoomTypeTableComponent,
  ],
  templateUrl: './room-type-table-page.component.html',
  styleUrl: './room-type-table-page.component.scss',
})
export class RoomTypeTablePageComponent implements OnInit {
  private roomTypeService = inject(RoomTypeService);
  // La misma página se usa en el sitio público y en /admin/:adminId/room-types.
  readonly adminArea = isAdminArea(inject(ActivatedRoute));

  roomTypes: RoomTypeListDTO[] = [];
  toastMessage: string | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.roomTypeService.getAll().subscribe({
      next: (data) => {
        this.roomTypes = data;
      },
      error: (err) => {
        console.error('Error loading room types:', err);
      },
    });
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
    if (!this.adminArea) return;
    const deletedItem = this.roomTypes.find((rt) => rt.roomTypeId === id);
    if (!confirm(`Delete room type "${deletedItem?.name || id}"? This cannot be undone.`)) return;
    this.roomTypeService.delete(id).subscribe({
      next: () => {
        this.loadRoomTypes();
        this.triggerToast(
          `Room type "${deletedItem?.name || id}" was successfully removed.`,
        );
      },
      // El backend responde 409 con el motivo si hay habitaciones de este tipo.
      error: (err: HttpErrorResponse) => {
        this.triggerToast(
          err.error?.message || `Cannot delete room type "${deletedItem?.name || id}". Please try again.`,
        );
      },
    });
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
