import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, startWith, map, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { ServiceInfoComponent } from './components/service-info/service-info.component';
import { ServiceService } from '../../services/service.service';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-services-detail',
  imports: [
    AsyncPipe,
    ServiceInfoComponent,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    GalleryComponent,
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
  // Una id inválida muestra la pantalla 400; si la carga falla, la que corresponda (404, 500…).
  readonly state$: Observable<{ service?: ServiceDetailDTO; loading: boolean }> =
    this.route.paramMap.pipe(
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
