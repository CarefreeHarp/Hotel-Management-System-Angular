import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { AdministratorDTO } from '../../../../models/dto/administrator-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-administrator-info',
  imports: [RouterLink, ButtonComponent, StaffAvatarComponent],
  templateUrl: './administrator-info.component.html',
  styleUrl: './administrator-info.component.scss',
})
export class AdministratorInfoComponent {
  @Input({ required: true }) administrator?: AdministratorDTO;
  @Input() operatorCount = 0;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
