import { Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { AdministratorDTO } from '../../../../models/dto/administrator-dto';
import { basePath } from '../../../../utils/base-path';
import { OPERATOR_MESSAGES } from '../../../../utils/form-messages';
import type { OperatorsFormComponent } from '../../operators-form.component';

@Component({
  selector: 'app-operator-fields',
  imports: [ReactiveFormsModule, RouterLink, FormFieldComponent],
  templateUrl: './operator-fields.component.html',
  styleUrl: './operator-fields.component.scss',
})
export class OperatorFieldsComponent {
  @Input({ required: true }) form!: OperatorsFormComponent['form'];
  @Input({ required: true }) administrators: AdministratorDTO[] = [];
  @Input() submitted = false;
  @Input() isCreateMode = true;
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }

  protected readonly messages = OPERATOR_MESSAGES;

  // FormFieldComponent no tiene selector: aquí se replica su regla de error.
  get adminInvalid(): boolean {
    const adminId = this.form.controls.adminId;
    return adminId.invalid && (adminId.touched || this.submitted);
  }
}
