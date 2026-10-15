import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomTableComponent } from './components/room-table/room-table.component';
import { RoomService } from '../../services/room.service';
import { RoomListDTO } from '../../models/dto/room-list-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-rooms-list',
  imports: [AdminHeaderComponent, RouterLink, ButtonComponent, RoomTableComponent],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.scss',
})
export class RoomsListComponent {
  private readonly service = inject(RoomService);
  readonly base = basePath(inject(ActivatedRoute));
  // Una sola petición trae todas las habitaciones; cada sección muestra las suyas.
  activeRooms: RoomListDTO[] = [];
  inactiveRooms: RoomListDTO[] = [];
  loading = true;
  loadFailed = false;
  error = '';
  message = '';
  constructor() {
    this.load();
  }
  load(): void {
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    this.service.getAll().subscribe({
      next: (rooms) => {
        this.activeRooms = rooms.filter((room) => room.active);
        this.inactiveRooms = rooms.filter((room) => !room.active);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadFailed = true;
        this.loading = false;
        this.error =
          error.status === 0
            ? 'Cannot connect to Spring Boot at localhost:8080. Start the backend and try again.'
            : 'Unable to load rooms from the server. Please try again.';
      },
    });
  }
  deactivateRoom(room: RoomListDTO): void {
    this.clearNotices();
    this.service.deactivate(room.roomId).subscribe({
      next: () => this.showMessage(`Room ${room.number} was deactivated and moved to Inactive rooms.`),
      error: (error: HttpErrorResponse) => this.showError(error, 'Unable to deactivate this room. Please try again.'),
    });
  }

  activateRoom(room: RoomListDTO): void {
    this.clearNotices();
    this.service.activate(room.roomId).subscribe({
      next: () => this.showMessage(`Room ${room.number} was activated and is back in the list.`),
      error: (error: HttpErrorResponse) => this.showError(error, 'Unable to activate this room. Please try again.'),
    });
  }

  deleteRoom(room: RoomListDTO): void {
    this.clearNotices();
    if (!confirm(`Delete room ${room.number}? This cannot be undone.`)) return;
    this.service.delete(room.roomId).subscribe({
      next: () => this.showMessage(`Room ${room.number} deleted successfully.`),
      // La regla está en el backend: si tiene reservas o está ocupada responde 409
      // con el motivo, y la página lo muestra igual que el error del login.
      error: (error: HttpErrorResponse) => this.showError(error, 'Unable to delete this room. Please try again.'),
    });
  }

  private clearNotices(): void {
    this.message = '';
    this.error = '';
  }

  private showMessage(message: string): void {
    this.message = message;
    this.load();
    this.scrollToNotices();
  }

  private showError(error: HttpErrorResponse, fallback: string): void {
    this.error = error.error?.message || fallback;
    this.scrollToNotices();
  }

  // Los avisos están arriba de las tablas: si se actuó desde la sección de inactivas, se sube para verlos.
  private scrollToNotices(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
