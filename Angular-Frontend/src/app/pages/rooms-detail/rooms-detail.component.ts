import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { RoomInfoComponent } from './components/room-info/room-info.component';
import { RoomDetailDTO } from '../../models/dto/room-detail-dto';
import { RoomService } from '../../services/room.service';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-rooms-detail',
  imports: [
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
  private readonly service = inject(RoomService);
  get base(): string {
    return basePath(this.route);
  }
  loading = true;
  error = '';
  readonly item = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading = true;
        this.error = '';
        const id = Number(params.get('id'));
        const request: Observable<RoomDetailDTO | undefined> =
          Number.isSafeInteger(id) && id > 0
            ? this.service.getById(id)
            : of(undefined);
        return request.pipe(
          map((room) => {
            this.loading = false;
            return room;
          }),
          catchError(() => {
            this.loading = false;
            this.error = 'Unable to load this room from the server.';
            return of(undefined);
          }),
        );
      }),
    ),
  );
  readonly saved = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('saved') === 'true'),
    ),
  );
}
