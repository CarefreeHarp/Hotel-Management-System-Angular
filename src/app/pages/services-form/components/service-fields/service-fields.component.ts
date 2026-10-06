import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import type { ServicesFormComponent } from '../../services-form.component';

@Component({
  selector: 'app-service-fields',
  imports: [ReactiveFormsModule, FormFieldComponent],
  templateUrl: './service-fields.component.html',
  styleUrl: './service-fields.component.scss',
})
export class ServiceFieldsComponent {
  @Input({ required: true }) form!: ServicesFormComponent['form'];
  @Input() submitted = false;
  readonly textFields = [
    { key: 'name', label: 'Name', required: true, max: 100 },
    { key: 'category', label: 'Category', required: true, max: 50 },
    { key: 'summary', label: 'Summary', required: false, max: 255 },
    { key: 'duration', label: 'Duration', required: false, max: 50 },
    { key: 'availability', label: 'Availability', required: false, max: 100 },
    { key: 'location', label: 'Location', required: false, max: 100 },
  ] as const;

  error(control: AbstractControl): string {
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('maxlength'))
      return `Maximum ${control.getError('maxlength').requiredLength} characters.`;
    if (control.hasError('photoUrl'))
      return 'Enter a valid HTTP or HTTPS image URL.';
    return 'Enter a price from 0 to 99,999,999.99 with up to two decimal places.';
  }
}
