import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomTypeCommercialFieldsComponent } from './components/room-type-commercial-fields/room-type-commercial-fields.component';
import { PhotoFieldsComponent } from '../../components/photo-fields/photo-fields.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomTypeDetailDTO } from '../../models/dto/room-type-detail-dto';
import { basePath } from '../../utils/base-path';

export type RoomTypeForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  nightlyPrice: FormControl<number | null>;
  maxCapacity: FormControl<number | null>;
  mainPhoto: FormControl<string>;
  secondaryPhotos: FormArray<FormControl<string>>;
}>;

function requiredText(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function photoUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && url.hostname && !/\s/.test(value)
      ? null
      : { photoUrl: true };
  } catch {
    return { photoUrl: true };
  }
}

@Component({
  selector: 'app-room-type-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomTypeCommercialFieldsComponent,
    PhotoFieldsComponent,
  ],
  templateUrl: './room-type-form-page.component.html',
  styleUrl: './room-type-form-page.component.scss',
})
export class RoomTypeFormPageComponent {
  private readonly service = inject(RoomTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  roomType: RoomTypeDetailDTO | undefined;
  isCreateMode = false;
  submitted = false;
  error = '';

  readonly form: RoomTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(50)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(500)],
    }),
    nightlyPrice: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      (control) =>
        control.value === null || Number.isFinite(control.value)
          ? null
          : { number: true },
    ]),
    maxCapacity: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(10),
      (control) =>
        control.value === null || Number.isInteger(control.value)
          ? null
          : { integer: true },
    ]),
    mainPhoto: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(500), photoUrl],
    }),
    secondaryPhotos: new FormArray<FormControl<string>>([]),
  });

  constructor() {
    // Ya no se descargan todos los tipos para revisar el nombre: lo valida el backend.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const idParam = params.get('id');
      this.isCreateMode = idParam === null;
      const id = Number(idParam);
      this.submitted = false;
      this.error = '';
      this.form.controls.secondaryPhotos.clear();
      this.form.reset();

      if (!this.isCreateMode && Number.isSafeInteger(id) && id > 0) {
        this.service.getById(id).subscribe({
          next: (roomType) => {
            this.roomType = roomType;
            this.form.patchValue(roomType);
            this.form.controls.secondaryPhotos.clear();
            roomType.secondaryPhotos.forEach((photo) => this.addPhoto(photo));
            this.form.markAsPristine();
          },
          error: (err) => {
            console.error('Error fetching room type for edit:', err);
            this.roomType = undefined;
          },
        });
      } else {
        this.roomType = undefined;
      }
    });
  }

  addPhoto(value = ''): void {
    this.form.controls.secondaryPhotos.push(
      new FormControl(value, {
        nonNullable: true,
        validators: [Validators.maxLength(500), photoUrl],
      }),
    );
  }

  save(): void {
    this.submitted = true;
    this.error = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (value.nightlyPrice === null || value.maxCapacity === null) return;
    const roomTypeData = {
      name: value.name.trim(),
      description: value.description.trim(),
      nightlyPrice: value.nightlyPrice,
      maxCapacity: value.maxCapacity,
      mainPhoto: value.mainPhoto.trim(),
      secondaryPhotos: value.secondaryPhotos
        .map((photo) => photo.trim())
        .filter(Boolean),
    };
    if (this.isCreateMode) {
      this.service.add(roomTypeData).subscribe({
        next: (createdRoomType) => {
          void this.router.navigate(
            [this.base, 'room-types', createdRoomType.roomTypeId],
            {
              queryParams: { saved: true },
            },
          );
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
      return;
    }
    if (!this.roomType) {
      return;
    }
    this.service
      .update(this.roomType.roomTypeId, {
        ...roomTypeData,
        roomTypeId: this.roomType.roomTypeId,
      })
      .subscribe({
        next: () => {
          void this.router.navigate(
            [this.base, 'room-types', this.roomType!.roomTypeId],
            {
              queryParams: { saved: true },
            },
          );
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  // Si el nombre ya existe el backend responde 409 y su mensaje se muestra en el formulario.
  private showError(err: HttpErrorResponse): void {
    this.error =
      err.error?.message ||
      'Unable to save this room type. Check the server connection and try again.';
  }
}
