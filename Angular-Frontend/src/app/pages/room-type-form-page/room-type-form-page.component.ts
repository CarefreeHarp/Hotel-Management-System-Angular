import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomTypeCommercialFieldsComponent } from './components/room-type-commercial-fields/room-type-commercial-fields.component';
import {
  MAX_ADDITIONAL_PHOTOS,
  PhotoFieldsComponent,
} from '../../components/photo-fields/photo-fields.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomTypeDetailDTO } from '../../models/dto/room-type-detail-dto';
import { basePath } from '../../utils/base-path';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import {
  maxDecimals,
  photoUrl,
  positive,
  requiredText,
  wholeNumber,
} from '../../utils/form-validators';

export type RoomTypeForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  nightlyPrice: FormControl<number | null>;
  maxCapacity: FormControl<number | null>;
  mainPhoto: FormControl<string>;
  secondaryPhotos: FormArray<FormControl<string>>;
}>;

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
  loading = false;
  saving = false;
  error = '';

  // Mismas reglas que la entidad RoomType en el backend.
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
      positive,
      Validators.max(99999999.99),
      maxDecimals(2),
    ]),
    maxCapacity: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(10),
      wholeNumber,
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
      this.roomType = undefined;
      this.form.controls.secondaryPhotos.clear();
      this.form.reset();
      this.loading = !this.isCreateMode;
      if (this.isCreateMode) return;

      // Una id inválida muestra la pantalla 400; si el tipo no carga, la que corresponda.
      if (!Number.isSafeInteger(id) || id <= 0) {
        showErrorPage(this.router, this.route, 400);
        return;
      }
      this.service.getById(id).subscribe({
        next: (roomType) => {
          this.roomType = roomType;
          this.form.patchValue(roomType);
          this.form.controls.secondaryPhotos.clear();
          roomType.secondaryPhotos.forEach((photo) => this.addPhoto(photo));
          this.form.markAsPristine();
          this.loading = false;
        },
        error: (error: unknown) =>
          showErrorPage(this.router, this.route, errorPageCode(error)),
      });
    });
  }

  addPhoto(value = ''): void {
    // El backend admite como mucho 10 fotos adicionales por tipo.
    if (this.form.controls.secondaryPhotos.length >= MAX_ADDITIONAL_PHOTOS)
      return;
    this.form.controls.secondaryPhotos.push(
      new FormControl(value, {
        nonNullable: true,
        validators: [Validators.maxLength(500), photoUrl],
      }),
    );
  }

  save(): void {
    if (this.saving) return;
    this.submitted = true;
    this.error = '';
    clearApiErrors(this.form);
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
    if (!this.isCreateMode && !this.roomType) return;
    this.saving = true;
    if (this.isCreateMode) {
      this.service
        .add(roomTypeData)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
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
    this.service
      .update(this.roomType!.roomTypeId, {
        ...roomTypeData,
        roomTypeId: this.roomType!.roomTypeId,
      })
      .pipe(finalize(() => (this.saving = false)))
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

  // Si el nombre ya existe (409) o una foto no es válida, el motivo se muestra bajo su campo.
  private showError(err: HttpErrorResponse): void {
    this.error = showApiErrors(this.form, err);
  }
}
