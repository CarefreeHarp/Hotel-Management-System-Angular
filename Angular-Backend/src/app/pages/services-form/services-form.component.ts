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
import { PhotoFieldsComponent } from '../../components/photo-fields/photo-fields.component';
import { ServiceFieldsComponent } from './components/service-fields/service-fields.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ServiceService, ServiceData } from '../../services/service.service';
import { ServiceDetailDTO } from '../../models/dto/service-detail-dto';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { basePath } from '../../utils/base-path';

function requiredText(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function photoUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !/\s/.test(value)
      ? null
      : { photoUrl: true };
  } catch {
    return { photoUrl: true };
  }
}

@Component({
  selector: 'app-services-form',
  imports: [
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
  private readonly service = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly base = basePath(this.route);
  item: ServiceDetailDTO | undefined;
  isCreateMode = true;
  submitted = false;
  loading = false;
  saving = false;
  error = '';
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [requiredText],
    }),
    price: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(99999999.99),
      (control) => {
        const value = control.value;
        return value === null ||
          (Number.isFinite(value) &&
            Math.abs(value * 100 - Math.round(value * 100)) < 0.000001)
          ? null
          : { price: true };
      },
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
    this.route.paramMap.pipe(
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
        return !this.isCreateMode && Number.isSafeInteger(id) && id > 0
          ? this.service.getById(id).pipe(catchError(() => {
              this.error = 'Unable to load this service from the server.';
              return of(undefined);
            }))
          : of(undefined);
      }),
      takeUntilDestroyed(),
    ).subscribe((item) => {
      this.loading = false;
      this.item = item;
      if (item) {
        this.form.patchValue({ ...item, summary: item.summary ?? '', duration: item.duration ?? '',
          availability: item.availability ?? '', location: item.location ?? '' });
        (item.secondaryImageUrls ?? []).forEach((url) => this.addPhoto(url));
      }
    });
  }

  addPhoto(value = ''): void {
    this.form.controls.secondaryImageUrls.push(
      new FormControl(value, {
        nonNullable: true,
        validators: [Validators.maxLength(500), photoUrl],
      }),
    );
  }

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
    if (this.saving || this.loading) return;
    this.error = '';
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (value.price === null) return;
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
    if (!this.isCreateMode && !this.item) return;
    this.saving = true;
    // Ya no se descargan todos los servicios para revisar el nombre: si se repite,
    // el backend responde 409 y su mensaje se muestra en el formulario.
    const request = this.isCreateMode
      ? this.service.add(data).pipe(map((created) => created.serviceId))
      : this.service.update(this.item!.serviceId, data).pipe(map(() => this.item!.serviceId));
    request.pipe(finalize(() => { this.saving = false; })).subscribe({
      next: (id) => {
        void this.router.navigate([this.base, 'services', id], { queryParams: { saved: true } });
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Unable to save this service. Check the server connection and try again.';
      },
    });
  }
}
