import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormFieldComponent } from '../../../../components/form-field/form-field.component';
import { ButtonComponent } from '../../../../components/button/button.component';
import type { RoomTypeForm } from '../../room-type-form-page.component';

@Component({
  selector: 'app-room-type-photo-fields',
  imports: [FormFieldComponent, ButtonComponent],
  templateUrl: './room-type-photo-fields.component.html',
  styleUrl: './room-type-photo-fields.component.scss'
})
export class RoomTypePhotoFieldsComponent {
  @Input({ required: true }) form!: RoomTypeForm;
  @Input() submitted = false;
  @Output() addPhoto = new EventEmitter<void>();

  get photos() {
    return this.form.controls.secondaryPhotos;
  }
}
