import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { GalleryComponent } from '../../components/gallery/gallery.component';
import { ServiceInfoComponent } from './components/service-info/service-info.component';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-services-detail',
  imports: [
    ServiceInfoComponent,
    RouterLink,
    HeaderComponent,
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
  readonly item = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = Number(params.get('id'));
        return Number.isSafeInteger(id) && id > 0
          ? this.service.getById(id)
          : undefined;
      }),
    ),
  );
  readonly saved = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('saved') === 'true'),
    ),
  );
}
