import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { StaffAvatarComponent } from '../../../../components/staff-avatar/staff-avatar.component';
import { OperatorDTO } from '../../../../models/dto/operator-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-assigned-operators',
  imports: [RouterLink, ButtonComponent, StaffAvatarComponent],
  templateUrl: './assigned-operators.component.html',
  styleUrl: './assigned-operators.component.scss',
})
export class AssignedOperatorsComponent {
  // Administrador que se está consultando; puede ser distinto del que tiene la sesión.
  @Input({ required: true }) adminId = 0;
  @Input({ required: true }) operators: OperatorDTO[] = [];
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
