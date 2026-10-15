import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  @Input({ required: true }) control!: FormControl;
  @Input({ required: true }) fieldId = '';
  @Input({ required: true }) label = '';
  @Input() hideLabel = false;
  @Input() type = 'text';
  @Input() multiline = false;
  @Input() rows = 4;
  @Input() required = true;
  @Input() placeholder = '';
  @Input() prefix = '';
  @Input() maxlength: number | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number | null = null;
  @Input() hint = '';
  @Input() error = '';
  @Input() submitted = false;

  get invalid(): boolean {
    return this.control.invalid && (this.control.touched || this.submitted);
  }

  get describedBy(): string {
    return this.hint
      ? `${this.fieldId}-hint ${this.fieldId}-error`
      : `${this.fieldId}-error`;
  }
}
