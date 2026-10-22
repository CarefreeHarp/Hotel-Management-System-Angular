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
import { EMPTY, Observable, Subject, catchError, exhaustMap, finalize, map, of, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import {
  MAX_ADDITIONAL_PHOTOS,
  PhotoFieldsComponent,
} from '../../components/photo-fields/photo-fields.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { ActivationStatus } from '../../models/enums/activation-status';
import { ServiceData, ServiceService } from '../../services/service.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import {
  maxDecimals,
  photoUrl,
  requiredText,
} from '../../utils/form-validators';
import { ServiceFieldsComponent } from './components/service-fields/service-fields.component';

/** Coordina la carga y el guardado de servicios. Los campos reutilizables reciben el formulario. */
@Component({
  selector: 'app-services-form',
  imports: [
    SkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    PhotoFieldsComponent,
    ServiceFieldsComponent,
  ],
  templateUrl: './services-form.component.html',
  styleUrl: './services-form.component.scss',
})
export class ServicesFormComponent {
  private readonly saveSubject = new Subject<void>();
  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  item: ServiceDetailDTO | undefined;
  isCreateMode = true;
  submitted = false;
  loading = false;
  saving = false;
  error = '';
  // Mismas reglas que la entidad Service en el backend.
  readonly form = new FormGroup({
    activationStatus: new FormControl(ActivationStatus.ACTIVE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(5000)],
    }),
    price: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(99999999.99),
      maxDecimals(2),
    ]),
    category: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(50)],
    }),
    summary: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    duration: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    availability: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    mainImageUrl: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(500), photoUrl],
    }),
    secondaryImageUrls: new FormArray<FormControl<string>>([]),
  });

  constructor() {
    // exhaustMap ignora nuevos envíos mientras termina el guardado actual.
    this.saveSubject.pipe(
      exhaustMap(() => this.saveChanges()),
      takeUntilDestroyed(),
    ).subscribe();

    this.route.paramMap
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
        switchMap((params) => {
          const idParam = params.get('id');
          const id = Number(idParam);
          this.isCreateMode = idParam === null;
          this.item = undefined;
          this.error = '';
          this.loading = !this.isCreateMode;
          this.submitted = false;
          this.form.controls.secondaryImageUrls.clear();
          this.form.reset();
          if (this.isCreateMode) return of(undefined);
          // Una id inválida muestra la pantalla 400. Si el servicio no carga, la que corresponda.
          if (!Number.isSafeInteger(id) || id <= 0) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          return this.service
            .getById(id)
            .pipe(catchErrorPage(this.router, this.route));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((item) => {
        this.loading = false;
        this.item = item;
        if (item) {
          this.form.patchValue({
            ...item,
            summary: item.summary ?? '',
            duration: item.duration ?? '',
            availability: item.availability ?? '',
            location: item.location ?? '',
          });
          (item.secondaryImageUrls ?? []).forEach((url) => this.addPhoto(url));
        }
      });
  }

  addPhoto(value = ''): void {
    // El backend admite como mucho 10 fotos adicionales por servicio.
    if (this.form.controls.secondaryImageUrls.length >= MAX_ADDITIONAL_PHOTOS)
      return;
    this.form.controls.secondaryImageUrls.push(
      new FormControl(value, {
        nonNullable: true,
        validators: [Validators.maxLength(500), photoUrl],
      }),
    );
  }

  // En edición se conserva el nombre de URL guardado para no romper enlaces existentes.
  private generateUrlName(name: string): string {
    const base =
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 90)
        .replace(/-$/, '') || 'service';
    return base;
  }

  save(): void {
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    if (this.saving || this.loading) return EMPTY;
    this.error = '';
    this.submitted = true;
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid) return EMPTY;
    const value = this.form.getRawValue();
    if (value.price === null) return EMPTY;
    const data: ServiceData = {
      ...value,
      name: value.name.trim(),
      urlName: this.item?.urlName ?? this.generateUrlName(value.name),
      description: value.description.trim(),
      price: value.price,
      category: value.category.trim(),
      summary: value.summary.trim(),
      duration: value.duration.trim(),
      availability: value.availability.trim(),
      location: value.location.trim(),
      mainImageUrl: value.mainImageUrl.trim(),
      secondaryImageUrls: value.secondaryImageUrls
        .map((url) => url.trim())
        .filter(Boolean),
    };
    const item = this.item;
    if (!this.isCreateMode && !item) return EMPTY;
    this.saving = true;
    // Ya no se descargan todos los servicios para revisar el nombre: si se repite,
    // el backend responde 409 y su mensaje se muestra bajo el campo del nombre.
    const request = item && !this.isCreateMode
      ? this.service.update(item.serviceId, data).pipe(map(() => item.serviceId))
      : this.service.add(data).pipe(map((created) => created.serviceId));
    return request
      .pipe(
        // finalize restablece el estado de guardado tanto si la petición termina bien como si falla.
        finalize(() => {
          this.saving = false;
        }),
      ).pipe(
        tap((id) => {
          void this.router.navigate([this.base, 'services', id], {
            queryParams: { saved: true },
          });
        }),
        catchError((error: HttpErrorResponse) => {
          this.error = showApiErrors(this.form, error, { urlName: 'name' });

          return EMPTY;
        }),
      );
    return EMPTY;
  }
}
