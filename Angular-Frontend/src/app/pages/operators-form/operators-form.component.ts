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
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { emailAddress, requiredText } from '../../utils/form-validators';

@Component({
  selector: 'app-operators-form',
  imports: [
    SkeletonComponent,
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
  saveError = '';
  // Mismos límites que la entidad Operator en el backend.
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(60)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(60)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      // Que no se repita entre administradores y operarios lo revisa el backend (409).
      validators: [requiredText, Validators.maxLength(100), emailAddress],
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
    // Una id inválida muestra la pantalla 400; si la carga falla, la que corresponda.
    if (!this.isCreateMode && (!Number.isSafeInteger(id) || id <= 0)) {
      showErrorPage(this.router, this.route, 400);
      return;
    }
    // El selector solo necesita id y nombre de cada administrador (/administrators/options)
    // y, al editar, se pide únicamente este operario. Sin el selector no se puede guardar,
    // así que también al crear un fallo muestra la pantalla de error.
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

  // Los errores de campo del backend (como un correo ya usado, 409) se muestran bajo su campo;
  // el administrador a cargo llega como admin y corresponde al selector adminId.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = showApiErrors(this.form, error, { admin: 'adminId' });
    this.isSaving = false;
  }
}
