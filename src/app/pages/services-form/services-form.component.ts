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
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PhotoFieldsComponent } from '../../components/photo-fields/photo-fields.component';
import { ServiceFieldsComponent } from './components/service-fields/service-fields.component';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service';

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
    HeaderComponent,
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
  item: Service | undefined;
  isCreateMode = true;
  submitted = false;
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
    active: new FormControl(true, { nonNullable: true }),
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
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const idParam = params.get('id');
      const id = Number(idParam);
      this.isCreateMode = idParam === null;
      this.item =
        !this.isCreateMode && Number.isSafeInteger(id) && id > 0
          ? this.service.getById(id)
          : undefined;
      this.submitted = false;
      this.form.controls.secondaryImageUrls.clear();
      this.form.reset();
      if (this.item) {
        this.form.patchValue({
          ...this.item,
          summary: this.item.summary ?? '',
          duration: this.item.duration ?? '',
          availability: this.item.availability ?? '',
          location: this.item.location ?? '',
        });
        this.item.secondaryImageUrls.forEach((url) => this.addPhoto(url));
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
    const existing = new Set(
      this.service.getAll().map((item) => item.urlName.toLowerCase()),
    );
    let candidate = base;
    let suffix = 2;
    while (existing.has(candidate)) candidate = `${base}-${suffix++}`;
    return candidate;
  }

  save(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (value.price === null) return;
    const data: Omit<Service, 'serviceId'> = {
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
    if (this.isCreateMode) {
      const created = this.service.add(data);
      void this.router.navigate(['/services', created.serviceId], {
        queryParams: { saved: true },
      });
    } else if (this.item && this.service.getById(this.item.serviceId)) {
      this.service.update(this.item.serviceId, {
        ...data,
        serviceId: this.item.serviceId,
      });
      void this.router.navigate(['/services', this.item.serviceId], {
        queryParams: { saved: true },
      });
    } else {
      this.item = undefined;
    }
  }
}
