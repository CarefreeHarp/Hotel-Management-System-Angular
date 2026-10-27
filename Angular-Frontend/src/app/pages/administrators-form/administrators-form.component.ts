import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, Subject, catchError, exhaustMap, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { AdministratorDTO } from '../../models/dto/administrator-dto';
import { AdministratorService } from '../../services/administrator.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { emailAddress, requiredText } from '../../utils/form-validators';
import { AdministratorFieldsComponent } from './components/administrator-fields/administrator-fields.component';

/** Coordina la carga y el guardado de administradores. Los campos reutilizables reciben el formulario. */
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
    TranslocoPipe,
  ],
  templateUrl: './administrators-form.component.html',
  styleUrl: './administrators-form.component.scss',
})
export class AdministratorsFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly saveSubject = new Subject<void>();

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

  constructor() {
    // exhaustMap ignora nuevos envíos mientras termina el guardado actual.
    this.saveSubject.pipe(
      exhaustMap(() => this.saveChanges()),
      takeUntilDestroyed(),
    ).subscribe();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      // Cambiar de registro cancela sus lecturas anteriores y conserva solo el resultado vigente.
      switchMap((params) => this.loadRecord(params)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private loadRecord(params: ParamMap): Observable<unknown> {
    this.item = undefined;
    this.isLoading = true;
    this.form.reset();
    this.form.controls.password.enable();
    const idParam = params.get('id');
    const id = Number(idParam);
    this.isCreateMode = idParam === null;
    if (!this.isCreateMode) {
      // Al editar no se pide contraseña: el backend conserva la guardada.
      this.form.controls.password.disable();
    }
    if (this.isCreateMode) {
      this.isLoading = false;
      return EMPTY;
    }
    // Una id inválida muestra la pantalla 400. Si el administrador no carga, la que corresponda.
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return EMPTY;
    }
    // Al editar se pide solo este administrador, no la lista completa.
    return this.administratorService.getById(id).pipe(
      tap((administrator) => {
        this.item = administrator;
        this.form.patchValue({
          name: administrator.name,
          email: administrator.email,
        });
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }

  save(): void {
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    this.submitted = true;
    this.saveError = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return EMPTY;
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const email = value.email.trim();
    this.isSaving = true;
    if (this.isCreateMode) {
      return this.administratorService
        .add({ name, email, password: value.password }).pipe(
          tap(() => {
            void this.router.navigate([this.base, 'administrators'], {
              queryParams: { created: true },
            });
          }),
          catchError((error: HttpErrorResponse) => {
            this.showSaveError(error);
            return EMPTY;
          }),
        );
    } else if (this.item) {
      const id = this.item.adminId;
      return this.administratorService
        .update(id, { adminId: id, name, email }).pipe(
          tap(() => {
            void this.router.navigate([this.base, 'administrators', id], {
              queryParams: { saved: true },
            });
          }),
          catchError((error: HttpErrorResponse) => {
            this.showSaveError(error);
            return EMPTY;
          }),
        );
    }
    return EMPTY;
  }

  // Los errores de campo del backend (como un correo ya usado, 409) se muestran bajo su campo.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = showApiErrors(this.form, error);
    this.isSaving = false;
  }
}
