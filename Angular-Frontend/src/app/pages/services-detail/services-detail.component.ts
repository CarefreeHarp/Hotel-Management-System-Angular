import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, startWith, catchError, map, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { ServiceInfoComponent } from './components/service-info/service-info.component';
import { ServiceService } from '../../services/service.service';
import { basePath } from '../../utils/base-path';

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
  private readonly service = inject(ServiceService);
  get base(): string {
    return basePath(this.route);
  }
  readonly state$: Observable<{
    service?: ServiceDetailDTO;
    loading: boolean;
    error: string;
  }> = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = Number(params.get('id'));
      if (!Number.isSafeInteger(id) || id <= 0)
        return of({ loading: false, error: '' });
      return this.service.getById(id).pipe(
        map((service) => ({ service, loading: false, error: '' })),
        catchError(() =>
          of({
            loading: false,
            error: 'Unable to load this service from the server.',
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
