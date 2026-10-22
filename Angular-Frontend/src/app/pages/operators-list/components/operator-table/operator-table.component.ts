import { Component, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { OperatorDTO } from '../../../../models/dto/operator-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-operator-table',
  imports: [RouterLink, StaffAvatarComponent],
  templateUrl: './operator-table.component.html',
  styleUrl: './operator-table.component.scss',
})
export class OperatorTableComponent {
  @Input({ required: true }) operators: OperatorDTO[] = [];
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly deleteSubject = new Subject<OperatorDTO>();
  @Output('delete') readonly delete$ = this.deleteSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
