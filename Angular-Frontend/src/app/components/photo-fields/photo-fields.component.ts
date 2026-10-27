import { Component, Input, Output } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { PHOTO_MESSAGES } from '../../utils/form-messages';
import { ButtonComponent } from '../button/button.component';
import { FormFieldComponent } from '../form-field/form-field.component';

// Límite de fotos adicionales de tipos de habitación y servicios, como @Size(max = 10) en el backend.
export const MAX_ADDITIONAL_PHOTOS = 10;

/** Edita los controles de fotos que recibe. El formulario padre guarda las URLs. */
@Component({
  selector: 'app-photo-fields',
  imports: [FormFieldComponent, ButtonComponent, TranslocoPipe],
  templateUrl: './photo-fields.component.html',
  styleUrl: './photo-fields.component.scss',
})
export class PhotoFieldsComponent {
  @Input({ required: true }) mainPhoto = new FormControl('', { nonNullable: true });
  @Input({ required: true }) photos = new FormArray<FormControl<string>>([]);
  @Input() submitted = false;
  // Textos ya traducidos. Sin valor se muestran el título y la descripción genéricos.
  @Input() title = '';
  @Input() description = '';
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly addPhotoSubject = new Subject<void>();
  @Output('addPhoto') readonly addPhoto$ = this.addPhotoSubject.asObservable();
  protected readonly messages = PHOTO_MESSAGES;
  protected readonly maxPhotos = MAX_ADDITIONAL_PHOTOS;
}
