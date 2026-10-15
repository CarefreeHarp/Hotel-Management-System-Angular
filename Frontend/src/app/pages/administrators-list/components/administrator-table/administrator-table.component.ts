import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { AdministratorListDTO } from '../../../../models/dto/administrator-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-administrator-table',
  imports: [RouterLink, StaffAvatarComponent],
  templateUrl: './administrator-table.component.html',
  styleUrl: './administrator-table.component.scss',
})
export class AdministratorTableComponent {
  @Input({ required: true }) administrators: AdministratorListDTO[] = [];
  @Output() delete = new EventEmitter<AdministratorListDTO>();
  readonly base = basePath(inject(ActivatedRoute));
}
