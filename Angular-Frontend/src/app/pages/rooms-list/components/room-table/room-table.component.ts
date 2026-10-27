import { Component, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { RoomListDTO } from '../../../../models/dto/room-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-table',
  imports: [OptimizedImageDirective, RouterLink, TranslocoPipe],
  templateUrl: './room-table.component.html',
  styleUrl: './room-table.component.scss',
})
export class RoomTableComponent {
  @Input({ required: true }) rooms: RoomListDTO[] = [];
  protected readonly toggleActivationSubject = new Subject<RoomListDTO>();
  @Output('toggleActivation') readonly toggleActivation$ = this.toggleActivationSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
