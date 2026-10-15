import { Component, Input } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import type { AdministratorsFormComponent } from '../../administrators-form.component';

@Component({
  selector: 'app-administrator-fields',
  imports: [FormFieldComponent],
  templateUrl: './administrator-fields.component.html',
  styleUrl: './administrator-fields.component.scss',
})
export class AdministratorFieldsComponent {
  @Input({ required: true }) form!: AdministratorsFormComponent['form'];
  @Input() submitted = false;
  @Input() isCreateMode = true;

  nameError(): string {
    return this.form.controls.name.hasError('required')
      ? "Enter the administrator's name."
      : 'The name cannot exceed 50 characters.';
  }

  emailError(): string {
    const email = this.form.controls.email;
    if (email.hasError('required')) return 'Enter the email address.';
    return 'Enter a valid email address with at most 80 characters.';
  }
}
