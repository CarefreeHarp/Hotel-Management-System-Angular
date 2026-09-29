import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RoomTypeLayoutComponent } from '../../components/room-type-layout/room-type-layout.component';
import { RoomTypeService } from '../../services/room-type.service';

@Component({
  selector: 'app-room-type-detail',
  imports: [DecimalPipe, RouterLink, RoomTypeLayoutComponent],
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
