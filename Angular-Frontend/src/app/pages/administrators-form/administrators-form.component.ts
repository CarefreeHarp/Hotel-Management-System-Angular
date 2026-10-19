import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { emailAddress, requiredText } from '../../utils/form-validators';

@Component({
  selector: 'app-administrators-form',
  imports: [
    SkeletonComponent,
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
  get base(): string {
    return basePath(this.route);
  }
  item: AdministratorDTO | undefined;
  isCreateMode = true;
  isLoading = true;
  isSaving = false;
  submitted = false;
  saveError = '';
  // Mismos límites que la entidad Administrator en el backend.
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(60)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      // Que no se repita entre administradores y operarios lo revisa el backend (409).
      validators: [requiredText, Validators.maxLength(100), emailAddress],
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
    if (this.isCreateMode) {
      this.isLoading = false;
      return;
    }
    // Una id inválida muestra la pantalla 400; si el administrador no carga, la que corresponda.
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
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
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }

  save(): void {
    this.submitted = true;
    this.saveError = '';
    clearApiErrors(this.form);
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

  // Los errores de campo del backend (como un correo ya usado, 409) se muestran bajo su campo.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = showApiErrors(this.form, error);
    this.isSaving = false;
  }
}
