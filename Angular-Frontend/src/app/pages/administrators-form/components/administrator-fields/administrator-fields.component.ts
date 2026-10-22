import { Component, Input } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { ADMINISTRATOR_MESSAGES } from '../../../../utils/form-messages';
import type { AdministratorsFormComponent } from '../../administrators-form.component';

@Component({
  selector: 'app-administrator-fields',
  imports: [FormFieldComponent],
  templateUrl: './administrator-fields.component.html',
  styleUrl: './administrator-fields.component.scss',
})
export class AdministratorFieldsComponent {
  @Input({ required: true }) form?: AdministratorsFormComponent['form'];
  @Input() submitted = false;
  @Input() isCreateMode = true;
  protected readonly messages = ADMINISTRATOR_MESSAGES;
}
