import { ActivationStatus } from '../../../../models/enums/activation-status';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { SERVICE_MESSAGES } from '../../../../utils/form-messages';
import type { ServicesFormComponent } from '../../services-form.component';

@Component({
  selector: 'app-service-fields',
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: './service-fields.component.html',
  styleUrl: './service-fields.component.scss',
})
export class ServiceFieldsComponent {
  readonly activationOptions = Object.values(ActivationStatus).map((value) => ({
    value,
    label: value === ActivationStatus.ACTIVE ? 'Active' : 'Inactive',
  }));
  @Input({ required: true }) form!: ServicesFormComponent['form'];
  @Input() submitted = false;
  protected readonly messages = SERVICE_MESSAGES;
  readonly textFields = [
    { key: 'name', label: 'Name', required: true, max: 100 },
    { key: 'category', label: 'Category', required: true, max: 50 },
    { key: 'summary', label: 'Summary', required: false, max: 255 },
    { key: 'duration', label: 'Duration', required: false, max: 50 },
    { key: 'availability', label: 'Schedule', required: false, max: 100 },
    { key: 'location', label: 'Location', required: false, max: 100 },
  ] as const;
}
