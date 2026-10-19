import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ButtonComponent } from '../../components/button/button.component';
import { basePath } from '../../utils/base-path';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { RoomTypeTableComponent } from './components/room-type-table/room-type-table.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomTypeListDTO } from '../../models/dto/room-type-list-dto';
import { isAdminArea } from '../../utils/base-path';
import { apiErrorMessage } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-room-type-table-page',
  imports: [
    SkeletonComponent,
    CommonModule,
    HeaderComponent,
    AdminHeaderComponent,
    RouterLink,
    ButtonComponent,
    RoomTypeTableComponent,
  ],
  templateUrl: './room-type-table-page.component.html',
  styleUrl: './room-type-table-page.component.scss',
})
export class RoomTypeTablePageComponent implements OnInit {
  private roomTypeService = inject(RoomTypeService);
  // La misma página se usa en el sitio público y en /admin/:adminId/room-types.
  readonly adminArea = isAdminArea(inject(ActivatedRoute));

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  isLoading = true;
  roomTypes: RoomTypeListDTO[] = [];
  toastMessage: string | null = null;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.isLoading = true;
    this.roomTypeService.getAll().subscribe({
      next: (data) => {
        this.roomTypes = data;
        this.isLoading = false;
      },
      // Sin la lista la página no tiene qué mostrar: se muestra la pantalla de error.
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }

  handleDelete(id: number): void {
    if (!this.adminArea) return;
    const deletedItem = this.roomTypes.find((rt) => rt.roomTypeId === id);
    if (
      !confirm(
        `Delete room type "${deletedItem?.name || id}"? This cannot be undone.`,
      )
    )
      return;
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
          apiErrorMessage(
            err,
            `Cannot delete room type "${deletedItem?.name || id}". Please try again.`,
          ),
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
