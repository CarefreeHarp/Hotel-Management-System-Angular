import { Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { AdministratorDTO } from '../../../../models/dto/administrator-dto';
import { basePath } from '../../../../utils/base-path';
import { OPERATOR_MESSAGES } from '../../../../utils/form-messages';
import type { OperatorsFormComponent } from '../../operators-form.component';

@Component({
  selector: 'app-operator-fields',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent, TranslocoPipe],
  templateUrl: './operator-fields.component.html',
  styleUrl: './operator-fields.component.scss',
})
export class OperatorFieldsComponent {
  @Input({ required: true }) form?: OperatorsFormComponent['form'];
  @Input({ required: true }) administrators: AdministratorDTO[] = [];
  @Input() submitted = false;
  @Input() isCreateMode = true;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }

  protected readonly messages = OPERATOR_MESSAGES;

  // El selector de administrador usa la misma regla de visibilidad de errores que los demás campos.
  get adminInvalid(): boolean {
    const adminId = this.form?.controls.adminId;
    if (!adminId) return false;
    return adminId.invalid && (adminId.touched || this.submitted);
  }
}
