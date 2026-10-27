import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { translate } from '@jsverse/transloco';
import { FieldMessages } from '../../utils/form-messages';

/** Caracteres que admite un campo mientras se escribe. */
export type InputRestriction = 'digits' | 'phone';

const keepAllowed: Record<InputRestriction, (value: string) => string> = {
  digits: (value) => value.replace(/\D/g, ''),
  // Dígitos y un solo + al inicio.
  phone: (value) => value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, ''),
};

/**
 * Presenta un FormControl recibido y sus errores. El formulario padre define las reglas y el envío.
 * label, hint, placeholder y error llegan ya traducidos; messages trae claves de traducción.
 */
@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  @Input({ required: true }) control = new FormControl<string | number | null>(null);
  @Input({ required: true }) fieldId = '';
  @Input({ required: true }) label = '';
  @Input() hideLabel = false;
  @Input() type = 'text';
  @Input() multiline = false;
  @Input() options: { value: string; label: string }[] = [];
  @Input() rows = 4;
  @Input() required = true;
  @Input() placeholder = '';
  @Input() prefix = '';
  @Input() maxlength: number | null = null;
  // Números o fechas yyyy-MM-dd, según el tipo del campo.
  @Input() min: number | string | null = null;
  @Input() max: number | string | null = null;
  @Input() step: number | null = null;
  @Input() inputmode: string | null = null;
  @Input() restrict: InputRestriction | null = null;
  @Input() hint = '';
  @Input() error = '';
  // Clave de traducción por regla, por ejemplo { required: 'validation.client.name.required' }.
  @Input() messages: FieldMessages = {};
  // Valores para los marcadores {{ }} de esos mensajes, por ejemplo { capacity: 4 }.
  @Input() messageParams: Record<string, unknown> = {};
  @Input() submitted = false;

  get invalid(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  // El mensaje del backend para este campo tiene prioridad y se muestra tal cual. Luego, el de la regla local que falla.
  get errorMessage(): string {
    const server = this.control.getError('server');
    if (typeof server === 'string' && server) return server;
    const rule = Object.keys(this.control.errors ?? {}).find(
      (key) => this.messages[key],
    );
    const key = rule && this.messages[rule];
    return key ? translate(key, this.messageParams) : this.error;
  }

  get describedBy(): string {
    return this.hint
      ? `${this.fieldId}-hint ${this.fieldId}-error`
      : `${this.fieldId}-error`;
  }

  // Quita al escribir los caracteres que el campo no admite, por ejemplo letras en un teléfono.
  restrictInput(input: HTMLInputElement): void {
    if (!this.restrict) return;
    const value = keepAllowed[this.restrict](input.value);
    if (value === input.value) return;
    input.value = value;
    this.control.setValue(value);
  }
}
