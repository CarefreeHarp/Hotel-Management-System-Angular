import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { OperatorDTO } from '../../../../models/dto/operator-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-operator-info',
  imports: [RouterLink, ButtonComponent, StaffAvatarComponent],
  templateUrl: './operator-info.component.html',
  styleUrl: './operator-info.component.scss',
})
export class OperatorInfoComponent {
  @Input({ required: true }) operator!: OperatorDTO;
  readonly base = basePath(inject(ActivatedRoute));
}
