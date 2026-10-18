import { AsyncPipe } from '@angular/common';
import { clientQuery } from '../../utils/client-query';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomTypeInfoComponent } from './components/room-type-info/room-type-info.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { RoomTypeService } from '../../services/room-type.service';
import { basePath, isAdminArea } from '../../utils/base-path';

@Component({
  selector: 'app-room-type-detail',
  imports: [
    AsyncPipe,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomTypeInfoComponent,
    GalleryComponent,
  ],
  templateUrl: './room-type-detail.component.html',
  styleUrl: './room-type-detail.component.scss',
})
export class RoomTypeDetailComponent {
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RoomTypeService);
  get base(): string {
    return basePath(this.route);
  }
  readonly adminArea = isAdminArea(this.route);
  readonly roomType$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = Number(params.get('id'));
      return Number.isSafeInteger(id) && id > 0
        ? this.service.getById(id).pipe(catchError(() => of(undefined)))
        : of(undefined);
    }),
  );
  readonly saved$ = this.route.queryParamMap.pipe(
    map((params) => params.get('saved') === 'true'),
  );
}
