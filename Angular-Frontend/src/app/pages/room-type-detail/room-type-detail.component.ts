import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, map, startWith, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomTypeService } from '../../services/room-type.service';
import { basePath, isAdminArea } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { RoomTypeInfoComponent } from './components/room-type-info/room-type-info.component';

@Component({
  selector: 'app-room-type-detail',
  imports: [
    SkeletonComponent,
    AsyncPipe,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomTypeInfoComponent,
    GalleryComponent,
    TranslocoPipe,
  ],
  templateUrl: './room-type-detail.component.html',
  styleUrl: './room-type-detail.component.scss',
})
export class RoomTypeDetailComponent {
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RoomTypeService);
  get base(): string {
    return basePath(this.route);
  }
  readonly adminArea = isAdminArea(this.route);
  // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda (404, 500…).
  readonly roomType$ = this.route.paramMap.pipe(
    // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
    switchMap((params) => {
      const id = Number(params.get('id'));
      if (!Number.isSafeInteger(id) || id <= 0) {
        showErrorPage(this.router, this.route, 400);
        return EMPTY;
      }
      return this.service
        .getById(id)
        .pipe(catchErrorPage(this.router, this.route), startWith(null));
    }),
  );
  readonly saved$ = this.route.queryParamMap.pipe(
    map((params) => params.get('saved') === 'true'),
  );
}
