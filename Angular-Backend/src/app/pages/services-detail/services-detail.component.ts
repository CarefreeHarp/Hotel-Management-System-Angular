import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
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
  readonly base = basePath(this.route);
  loading = true;
  error = '';
  readonly item = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading = true;
        this.error = '';
        const id = Number(params.get('id'));
        return Number.isSafeInteger(id) && id > 0
          ? this.service.getById(id).pipe(
              map((item) => { this.loading = false; return item; }),
              catchError(() => { this.loading = false; this.error = 'Unable to load this service from the server.'; return of(undefined); }),
            )
          : of(undefined).pipe(map((item) => { this.loading = false; return item; }));
      }),
    ),
  );
  readonly saved = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('saved') === 'true'),
    ),
  );
}
