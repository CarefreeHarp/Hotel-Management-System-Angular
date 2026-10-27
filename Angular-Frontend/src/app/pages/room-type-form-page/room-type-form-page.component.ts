import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, Subject, catchError, exhaustMap, finalize, of, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import {
  MAX_ADDITIONAL_PHOTOS,
  PhotoFieldsComponent,
} from '../../components/photo-fields/photo-fields.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomTypeDetailDTO } from '../../models/dto/room-type-detail-dto';
import { RoomTypeService } from '../../services/room-type.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import {
  maxDecimals,
  photoUrl,
  positive,
  requiredText,
  wholeNumber,
} from '../../utils/form-validators';
import { RoomTypeCommercialFieldsComponent } from './components/room-type-commercial-fields/room-type-commercial-fields.component';

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
    SkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomTypeCommercialFieldsComponent,
    PhotoFieldsComponent,
    TranslocoPipe,
  ],
  templateUrl: './room-type-form-page.component.html',
  styleUrl: './room-type-form-page.component.scss',
})
export class RoomTypeFormPageComponent {
  private readonly saveSubject = new Subject<void>();
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
    // exhaustMap ignora nuevos envíos mientras termina el guardado actual.
    this.saveSubject.pipe(
      exhaustMap(() => this.saveChanges()),
      takeUntilDestroyed(),
    ).subscribe();

    this.route.paramMap.pipe(
      // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
      switchMap((params) => {
        const idParam = params.get('id');
        this.isCreateMode = idParam === null;
        const id = Number(idParam);
        this.submitted = false;
        this.error = '';
        this.roomType = undefined;
        this.form.controls.secondaryPhotos.clear();
        this.form.reset();
        this.loading = !this.isCreateMode;
        if (this.isCreateMode) {
          return of(undefined);
        }

        // Una id inválida muestra la pantalla 400. Si el tipo no carga, la que corresponda.
        if (!Number.isSafeInteger(id) || id <= 0) {
          showErrorPage(this.router, this.route, 400);
          return EMPTY;
        }
        return this.service.getById(id).pipe(catchErrorPage(this.router, this.route));
      }),
      takeUntilDestroyed(),
    ).subscribe((roomType) => {
      if (!roomType) {
        return;
      }
      this.roomType = roomType;
      this.form.patchValue(roomType);
      this.form.controls.secondaryPhotos.clear();
      for (const photo of roomType.secondaryPhotos) {
        this.addPhoto(photo);
      }
      this.form.markAsPristine();
      this.loading = false;
    });
  }

  addPhoto(value = ''): void {
    // El backend admite como mucho 10 fotos adicionales por tipo.
    if (this.form.controls.secondaryPhotos.length >= MAX_ADDITIONAL_PHOTOS) {
      return;
    }
    this.form.controls.secondaryPhotos.push(
      new FormControl(value, {
        nonNullable: true,
        validators: [Validators.maxLength(500), photoUrl],
      }),
    );
  }

  save(): void {
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    if (this.saving) {
      return EMPTY;
    }
    this.submitted = true;
    this.error = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return EMPTY;
    }
    const value = this.form.getRawValue();
    if (value.nightlyPrice === null || value.maxCapacity === null) {
      return EMPTY;
    }
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
    const roomType = this.roomType;
    if (!this.isCreateMode && !roomType) {
      return EMPTY;
    }
    this.saving = true;
    if (this.isCreateMode) {
      return this.service
        .add(roomTypeData)
        .pipe(finalize(() => (this.saving = false))).pipe(
          tap((createdRoomType) => {
            void this.router.navigate(
              [this.base, 'room-types', createdRoomType.roomTypeId],
              {
                queryParams: { saved: true },
              },
            );
          }),
          catchError((err: HttpErrorResponse) => {
            this.showError(err);
            return EMPTY;
          }),
        );
      return EMPTY;
    }
    if (!roomType) {
      return EMPTY;
    }
    return this.service
      .update(roomType.roomTypeId, {
        ...roomTypeData,
        roomTypeId: roomType.roomTypeId,
      })
      .pipe(finalize(() => (this.saving = false))).pipe(
        tap(() => {
          void this.router.navigate(
            [this.base, 'room-types', roomType.roomTypeId],
            {
              queryParams: { saved: true },
            },
          );
        }),
        catchError((err: HttpErrorResponse) => {
          this.showError(err);
          return EMPTY;
        }),
      );
    return EMPTY;
  }

  // Si el nombre ya existe (409) o una foto no es válida, el motivo se muestra bajo su campo.
  private showError(err: HttpErrorResponse): void {
    this.error = showApiErrors(this.form, err);
  }
}
