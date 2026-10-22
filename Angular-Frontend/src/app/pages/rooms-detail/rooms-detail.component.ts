import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, map, Observable, startWith, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomDetailDTO } from '../../models/dto/room-detail-dto';
import { RoomService } from '../../services/room.service';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { RoomInfoComponent } from './components/room-info/room-info.component';

@Component({
  selector: 'app-rooms-detail',
  imports: [
    SkeletonComponent,
    AsyncPipe,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    GalleryComponent,
    RoomInfoComponent,
  ],
  templateUrl: './rooms-detail.component.html',
  styleUrl: './rooms-detail.component.scss',
})
export class RoomsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RoomService);
  get base(): string {
    return basePath(this.route);
  }
  // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda (404, 500…).
  readonly state$: Observable<{ room?: RoomDetailDTO; loading: boolean }> =
    this.route.paramMap.pipe(
      // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
      switchMap((params) => {
        const id = Number(params.get('id'));
        if (!Number.isSafeInteger(id) || id <= 0) {
          showErrorPage(this.router, this.route, 400);
          return EMPTY;
        }
        return this.service.getById(id).pipe(
          map((room) => ({ room, loading: false })),
          catchErrorPage(this.router, this.route),
          startWith({ loading: true }),
        );
      }),
    );
  readonly saved$ = this.route.queryParamMap.pipe(
    map((params) => params.get('saved') === 'true'),
  );
}
