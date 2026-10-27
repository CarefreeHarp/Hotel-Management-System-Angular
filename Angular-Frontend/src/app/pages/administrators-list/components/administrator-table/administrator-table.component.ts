import { Component, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { AdministratorListDTO } from '../../../../models/dto/administrator-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-administrator-table',
  imports: [RouterLink, StaffAvatarComponent, TranslocoPipe],
  templateUrl: './administrator-table.component.html',
  styleUrl: './administrator-table.component.scss',
})
export class AdministratorTableComponent {
  @Input({ required: true }) administrators: AdministratorListDTO[] = [];
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly deleteSubject = new Subject<AdministratorListDTO>();
  @Output('delete') readonly delete$ = this.deleteSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
