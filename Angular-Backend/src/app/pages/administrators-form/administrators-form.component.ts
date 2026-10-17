import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { AdministratorFieldsComponent } from './components/administrator-fields/administrator-fields.component';
import { AdministratorService } from '../../services/administrator.service';
import { AdministratorDTO } from '../../models/dto/administrator-dto';
import { basePath } from '../../utils/base-path';

function requiredText(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

// Mismo formato de correo que validaba el proyecto anterior en Spring Boot.
function emailAddress(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? null
    : { email: true };
}

@Component({
  selector: 'app-administrators-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    AdministratorFieldsComponent,
  ],
  templateUrl: './administrators-form.component.html',
  styleUrl: './administrators-form.component.scss',
})
export class AdministratorsFormComponent implements OnInit {
  private readonly administratorService = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly base = basePath(this.route);
  item: AdministratorDTO | undefined;
  isCreateMode = true;
  isLoading = true;
  isSaving = false;
  submitted = false;
  loadError = '';
  saveError = '';
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      // Que no se repita entre administradores y operarios lo revisa el backend (409).
      validators: [requiredText, Validators.maxLength(80), emailAddress],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255),
      ],
    }),
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    this.isCreateMode = idParam === null;
    if (!this.isCreateMode) {
      // Al editar no se pide contraseña: el backend conserva la guardada.
      this.form.controls.password.disable();
    }
    if (this.isCreateMode || !Number.isSafeInteger(id) || id <= 0) {
      this.isLoading = false;
      return;
    }
    // Al editar se pide solo este administrador, no la lista completa.
    this.administratorService.getById(id).subscribe({
      next: (administrator) => {
        this.item = administrator;
        this.form.patchValue({
          name: administrator.name,
          email: administrator.email,
        });
        this.isLoading = false;
      },
      error: () => {
        this.loadError =
          'The form could not be loaded. Make sure the Spring Boot backend is running at http://localhost:8080 and reload the page.';
        this.isLoading = false;
      },
    });
  }

  save(): void {
    this.submitted = true;
    this.saveError = '';
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const email = value.email.trim();
    this.isSaving = true;
    if (this.isCreateMode) {
      this.administratorService
        .add({ name, email, password: value.password })
        .subscribe({
          next: () => {
            void this.router.navigate([this.base, 'administrators'], {
              queryParams: { created: true },
            });
          },
          error: (error: HttpErrorResponse) => this.showSaveError(error),
        });
    } else if (this.item) {
      const id = this.item.adminId;
      this.administratorService
        .update(id, { adminId: id, name, email })
        .subscribe({
          next: () => {
            void this.router.navigate([this.base, 'administrators', id], {
              queryParams: { saved: true },
            });
          },
          error: (error: HttpErrorResponse) => this.showSaveError(error),
        });
    }
  }

  // Si el correo ya lo usa otra cuenta del staff, el backend responde 409 y su mensaje se muestra aquí.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError =
      error.error?.message || 'The administrator could not be saved. Make sure the backend is running and try again.';
    this.isSaving = false;
  }
}
