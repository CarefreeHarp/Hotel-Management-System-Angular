import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, map, Observable, startWith, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { ServiceService } from '../../services/service.service';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { ServiceInfoComponent } from './components/service-info/service-info.component';

@Component({
  selector: 'app-services-detail',
  imports: [
    SkeletonComponent,
    AsyncPipe,
    ServiceInfoComponent,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    GalleryComponent,
    TranslocoPipe,
  ],
  templateUrl: './services-detail.component.html',
  styleUrl: './services-detail.component.scss',
})
export class ServicesDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ServiceService);
  get base(): string {
    return basePath(this.route);
  }
  // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda (404, 500…).
  readonly state$: Observable<{ service?: ServiceDetailDTO; loading: boolean }> =
    this.route.paramMap.pipe(
      // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
      switchMap((params) => {
        const id = Number(params.get('id'));
        if (!Number.isSafeInteger(id) || id <= 0) {
          showErrorPage(this.router, this.route, 400);
          return EMPTY;
        }
        return this.service.getById(id).pipe(
          map((service) => ({ service, loading: false })),
          catchErrorPage(this.router, this.route),
          startWith({ loading: true }),
        );
      }),
    );
  readonly saved$ = this.route.queryParamMap.pipe(
    map((params) => params.get('saved') === 'true'),
  );
}
