import { Component, input } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import type { ClientForm } from '../../clients-form.component';

@Component({
  selector: 'app-client-fields',
  imports: [FormFieldComponent],
  templateUrl: './client-fields.component.html',
  styleUrl: './client-fields.component.scss',
})
export class ClientFieldsComponent {
  readonly form = input.required<ClientForm>();
  readonly submitted = input(false);
  readonly isCreateMode = input(true);
}
