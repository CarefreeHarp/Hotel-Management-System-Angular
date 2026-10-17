import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  @Output() delete = new EventEmitter<OperatorDTO>();
  readonly base = basePath(inject(ActivatedRoute));
}
