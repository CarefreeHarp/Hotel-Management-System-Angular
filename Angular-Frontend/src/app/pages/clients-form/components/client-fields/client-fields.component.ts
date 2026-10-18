import { Component, Input } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { CLIENT_MESSAGES } from '../../../../utils/form-messages';
import type { ClientForm } from '../../clients-form.component';

@Component({
  selector: 'app-client-fields',
  imports: [FormFieldComponent],
  templateUrl: './client-fields.component.html',
  styleUrl: './client-fields.component.scss',
})
export class ClientFieldsComponent {
  @Input({ required: true }) form: ClientForm | undefined;
  @Input() submitted = false;
  @Input() isCreateMode = true;
  protected readonly messages = CLIENT_MESSAGES;
}
