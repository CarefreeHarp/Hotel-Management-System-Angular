import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ButtonComponent } from '../button/button.component';
import { PHOTO_MESSAGES } from '../../utils/form-messages';

// Límite de fotos adicionales de tipos de habitación y servicios, como @Size(max = 10) en el backend.
export const MAX_ADDITIONAL_PHOTOS = 10;

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
  protected readonly messages = PHOTO_MESSAGES;
  protected readonly maxPhotos = MAX_ADDITIONAL_PHOTOS;
}
