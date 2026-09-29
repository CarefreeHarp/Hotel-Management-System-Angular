import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomTypeInfoComponent } from './components/room-type-info/room-type-info.component';
import { RoomTypeGalleryComponent } from './components/room-type-gallery/room-type-gallery.component';
import { RoomTypeService } from '../../services/room-type.service';

@Component({
  selector: 'app-room-type-detail',
  imports: [RouterLink, HeaderComponent, PageHeadingComponent, ButtonComponent, RoomTypeInfoComponent, RoomTypeGalleryComponent],
  templateUrl: './room-type-detail.component.html',
  styleUrl: './room-type-detail.component.scss'
})
export class RoomTypeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RoomTypeService);
  readonly roomType = toSignal(this.route.paramMap.pipe(map(params => {
    const id = Number(params.get('id'));
    return Number.isSafeInteger(id) && id > 0 ? this.service.getById(id) : undefined;
  })));
  readonly saved = toSignal(this.route.queryParamMap.pipe(map(params => params.get('saved') === 'true')));
}
