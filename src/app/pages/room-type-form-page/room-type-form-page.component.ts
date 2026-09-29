import { Component, inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoomTypeLayoutComponent } from '../../components/room-type-layout/room-type-layout.component';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomType } from '../../models/room-type';

function requiredText(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function photoUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && url.hostname && !/\s/.test(value) ? null : { photoUrl: true };
  } catch {
    return { photoUrl: true };
  }
}

@Component({
  selector: 'app-room-type-form-page',
  imports: [ReactiveFormsModule, RouterLink, RoomTypeLayoutComponent],
  templateUrl: './room-type-form-page.component.html',
  styleUrl: './room-type-form-page.component.scss'
})
export class RoomTypeFormPageComponent {
  private readonly service = inject(RoomTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  roomType: RoomType | undefined;
  isCreateMode = false;
  submitted = false;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(50), control => {
      const name = String(control.value).trim().toLowerCase();
      return this.service.getAll().some(type => type.roomTypeId !== this.roomType?.roomTypeId && type.name.trim().toLowerCase() === name)
        ? { duplicate: true } : null;
    }] }),
    description: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(500)] }),
    nightlyPrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0), control =>
      control.value === null || Number.isFinite(control.value) ? null : { number: true }]),
    maxCapacity: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(10), control =>
      control.value === null || Number.isInteger(control.value) ? null : { integer: true }]),
    mainPhoto: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(500), photoUrl] }),
    secondaryPhotos: new FormArray<FormControl<string>>([]),
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const idParam = params.get('id');
      this.isCreateMode = idParam === null;
      const id = Number(idParam);
      this.roomType = this.isCreateMode || !Number.isSafeInteger(id) || id <= 0
        ? undefined
        : this.service.getById(id);
      this.submitted = false;
      this.form.controls.secondaryPhotos.clear();
      this.form.reset();
      if (this.roomType) {
        this.form.patchValue(this.roomType);
        this.roomType.secondaryPhotos.forEach(photo => this.addPhoto(photo));
        this.form.markAsPristine();
      }
    });
  }

  addPhoto(value = ''): void {
    this.form.controls.secondaryPhotos.push(new FormControl(value, {
      nonNullable: true, validators: [Validators.maxLength(500), photoUrl],
    }));
  }

  invalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted);
  }

  save(): void {
    this.submitted = true;
    this.form.controls.name.updateValueAndValidity();
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
      secondaryPhotos: value.secondaryPhotos.map(photo => photo.trim()).filter(Boolean),
    };
    if (this.isCreateMode) {
      const createdRoomType = this.service.add(roomTypeData);
      void this.router.navigate(['/room-types', createdRoomType.roomTypeId], { queryParams: { saved: true } });
      return;
    }
    if (!this.roomType || !this.service.getById(this.roomType.roomTypeId)) {
      this.roomType = undefined;
      return;
    }
    this.service.update(this.roomType.roomTypeId, { ...roomTypeData, roomTypeId: this.roomType.roomTypeId });
    void this.router.navigate(['/room-types', this.roomType.roomTypeId], { queryParams: { saved: true } });
  }
}
