import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-photo-fields',
  imports: [FormFieldComponent, ButtonComponent],
  templateUrl: './photo-fields.component.html',
  styleUrl: './photo-fields.component.scss',
})
export class PhotoFieldsComponent {
  @Input({ required: true }) mainPhoto!: FormControl<string>;
  @Input({ required: true }) photos!: FormArray<FormControl<string>>;
  @Input() submitted = false;
  @Input() title = 'Gallery';
  @Input() description = 'Add a main photo and optional gallery images.';
  @Output() addPhoto = new EventEmitter<void>();
}
