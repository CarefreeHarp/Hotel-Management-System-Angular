import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { ActivationStatus } from '../../../../models/enums/activation-status';
import { SERVICE_MESSAGES } from '../../../../utils/form-messages';
import type { ServicesFormComponent } from '../../services-form.component';

@Component({
  selector: 'app-service-fields',
  imports: [ReactiveFormsModule, FormFieldComponent, TranslocoPipe],
  templateUrl: './service-fields.component.html',
  styleUrl: './service-fields.component.scss',
})
export class ServiceFieldsComponent {
  // Se traduce al crear el componente: el idioma no cambia sin recargar la página.
  readonly activationOptions = Object.values(ActivationStatus).map((value) => ({
    value,
    label: translate(`enums.activationStatus.${value}`),
  }));
  @Input({ required: true }) form?: ServicesFormComponent['form'];
  @Input() submitted = false;
  protected readonly messages = SERVICE_MESSAGES;
  readonly textFields = [
    { key: 'name', labelKey: 'services.fields.name', required: true, max: 100 },
    { key: 'category', labelKey: 'services.fields.category', required: true, max: 50 },
    { key: 'summary', labelKey: 'services.fields.summary', required: false, max: 255 },
    { key: 'duration', labelKey: 'services.fields.duration', required: false, max: 50 },
    { key: 'availability', labelKey: 'services.fields.schedule', required: false, max: 100 },
    { key: 'location', labelKey: 'services.fields.location', required: false, max: 100 },
  ] as const;
}
