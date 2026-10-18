import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, startWith, catchError, map, of, switchMap } from 'rxjs';
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
  private readonly service = inject(RoomService);
  get base(): string {
    return basePath(this.route);
  }
  readonly state$: Observable<{
    room?: RoomDetailDTO;
    loading: boolean;
    error: string;
  }> = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = Number(params.get('id'));
      if (!Number.isSafeInteger(id) || id <= 0)
        return of({ loading: false, error: '' });
      return this.service.getById(id).pipe(
        map((room) => ({ room, loading: false, error: '' })),
        catchError(() =>
          of({
            loading: false,
            error: 'Unable to load this room from the server.',
          }),
        ),
        startWith({ loading: true, error: '' }),
      );
    }),
  );
  readonly saved$ = this.route.queryParamMap.pipe(
    map((params) => params.get('saved') === 'true'),
  );
}
