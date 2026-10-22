import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, exhaustMap, switchMap, takeUntil, tap, timer } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomTypeListDTO } from '../../models/dto/room-type-list-dto';
import { RoomTypeService } from '../../services/room-type.service';
import { apiErrorMessage } from '../../utils/api-error';
import { basePath, isAdminArea } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { RoomTypeTableComponent } from './components/room-type-table/room-type-table.component';

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
  private readonly actionSubject = new Subject<number>();
  private readonly loadSubject = new Subject<void>();
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
  private readonly toastSubject = new Subject<void>();
  private readonly dismissToastSubject = new Subject<void>();

  constructor() {
    // exhaustMap evita ejecutar otra acción mientras termina la petición actual.
    this.actionSubject.pipe(
      exhaustMap((id) => this.performAction(id)),
      takeUntilDestroyed(),
    ).subscribe();
    // Una recarga sustituye la lectura anterior. Las escrituras usan un flujo independiente.
    this.loadSubject.pipe(
      switchMap(() => this.loadRecords()),
      takeUntilDestroyed(),
    ).subscribe();

    // Un aviso nuevo reinicia los 4,5 segundos. Cerrarlo cancela solo la espera actual.
    this.toastSubject.pipe(
      switchMap(() => timer(4500).pipe(takeUntil(this.dismissToastSubject))),
      takeUntilDestroyed(),
    ).subscribe(() => (this.toastMessage = null));
  }

  ngOnInit(): void {
    this.loadRoomTypes();
  }

  loadRoomTypes(): void {
    this.loadSubject.next();
  }

  private loadRecords(): Observable<unknown> {
    this.isLoading = true;
    return this.roomTypeService.getAll().pipe(
      tap((data) => {
        this.roomTypes = data;
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }

  handleDelete(id: number): void {
    this.actionSubject.next(id);
  }

  private performAction(id: number): Observable<unknown> {
    if (!this.adminArea) return EMPTY;
    const deletedItem = this.roomTypes.find((rt) => rt.roomTypeId === id);
    if (
      !confirm(
        `Delete room type "${deletedItem?.name || id}"? This cannot be undone.`,
      )
    )
      return EMPTY;
    return this.roomTypeService.delete(id).pipe(
      tap(() => {
        this.loadRoomTypes();
        this.triggerToast(
          `Room type "${deletedItem?.name || id}" was successfully removed.`,
        );
      }),
      catchError((err: HttpErrorResponse) => {
        this.triggerToast(
          apiErrorMessage(
            err,
            `Cannot delete room type "${deletedItem?.name || id}". Please try again.`,
          ),
        );

        return EMPTY;
      }),
    );
  }

  triggerToast(message: string): void {
    this.toastMessage = message;
    this.toastSubject.next();
  }

  dismissToast(): void {
    this.toastMessage = null;
    this.dismissToastSubject.next();
  }
}
