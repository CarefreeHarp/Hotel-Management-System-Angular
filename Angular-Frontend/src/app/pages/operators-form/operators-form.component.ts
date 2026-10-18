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
import { forkJoin, of } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OperatorFieldsComponent } from './components/operator-fields/operator-fields.component';
import { AdministratorService } from '../../services/administrator.service';
import { OperatorService } from '../../services/operator.service';
import { AdministratorDTO } from '../../models/dto/administrator-dto';
import { OperatorDTO } from '../../models/dto/operator-dto';
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
  selector: 'app-operators-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    OperatorFieldsComponent,
  ],
  templateUrl: './operators-form.component.html',
  styleUrl: './operators-form.component.scss',
})
export class OperatorsFormComponent implements OnInit {
  private readonly operatorService = inject(OperatorService);
  private readonly administratorService = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  administrators: AdministratorDTO[] = [];
  item: OperatorDTO | undefined;
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
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(50)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      // Que no se repita entre administradores y operarios lo revisa el backend (409).
      validators: [requiredText, Validators.maxLength(80), emailAddress],
    }),
    adminId: new FormControl<number | null>(null, Validators.required),
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
    if (!this.isCreateMode && (!Number.isSafeInteger(id) || id <= 0)) {
      this.isLoading = false;
      return;
    }
    // El selector solo necesita id y nombre de cada administrador (/administrators/options)
    // y, al editar, se pide únicamente este operario.
    forkJoin({
      administrators: this.administratorService.getOptions(),
      operator: this.isCreateMode
        ? of(undefined)
        : this.operatorService.getById(id),
    }).subscribe({
      next: ({ administrators, operator }) => {
        this.administrators = administrators;
        this.item = operator;
        if (this.item) {
          this.form.patchValue({
            name: this.item.name,
            lastName: this.item.lastName,
            email: this.item.email,
            adminId: this.item.adminId,
          });
        } else if (this.isCreateMode) {
          // El detalle de un administrador envía ?adminId= para preseleccionarlo.
          const adminId = Number(
            this.route.snapshot.queryParamMap.get('adminId'),
          );
          if (
            administrators.some(
              (administrator) => administrator.adminId === adminId,
            )
          ) {
            this.form.controls.adminId.setValue(adminId);
          }
        }
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
    if (value.adminId === null) return;
    // Del administrador solo se envía la id: el backend lo busca para asignarlo.
    const data = {
      name: value.name.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      admin: { adminId: value.adminId },
    };
    this.isSaving = true;
    if (this.isCreateMode) {
      this.operatorService
        .add({ ...data, password: value.password })
        .subscribe({
          next: () => {
            void this.router.navigate([this.base, 'operators'], {
              queryParams: { created: true },
            });
          },
          error: (error: HttpErrorResponse) => this.showSaveError(error),
        });
    } else if (this.item) {
      const id = this.item.operatorId;
      this.operatorService.update(id, data).subscribe({
        next: () => {
          void this.router.navigate([this.base, 'operators', id], {
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
      error.error?.message ||
      'The operator could not be saved. Make sure the backend is running and try again.';
    this.isSaving = false;
  }
}
