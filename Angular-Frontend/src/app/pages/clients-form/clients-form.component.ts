import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, Subject, catchError, exhaustMap, of, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { ClientService } from '../../services/client.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import {
  catchErrorPage,
  showErrorPage
} from '../../utils/error-page';
import {
  emailAddress,
  nationalId,
  phoneNumber,
  photoUrl,
  requiredText,
} from '../../utils/form-validators';
import { ClientFieldsComponent } from './components/client-fields/client-fields.component';

export type ClientForm = FormGroup<{
  name: FormControl<string>;
  lastName: FormControl<string>;
  nationalId: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  profilePhoto: FormControl<string>;
}>;

@Component({
  selector: 'app-clients-form',
  imports: [
    SkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    HeaderComponent,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    ClientFieldsComponent,
    TranslocoPipe,
  ],
  templateUrl: './clients-form.component.html',
  styleUrl: './clients-form.component.scss',
})
export class ClientsFormComponent implements OnInit {
  private readonly saveSubject = new Subject<void>();

  private readonly service = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }
  get base(): string {
    return basePath(this.route);
  }
  clientId: number | undefined;
  isCreateMode = true;
  // El modo de perfil toma el identificador del cliente del parámetro auth de la URL.
  isProfile = false;
  isLoading = false;
  isSaving = false;
  submitted = false;
  saveError = '';
  readonly form: ClientForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(60)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, Validators.maxLength(60)],
    }),
    // Mismas reglas que la entidad Client en el backend.
    nationalId: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, nationalId],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [requiredText, phoneNumber],
    }),
    email: new FormControl('', {
      nonNullable: true,
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
    profilePhoto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500), photoUrl],
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
    this.isProfile = this.route.snapshot.data['profile'] === true;
    if (this.isProfile) {
      this.isCreateMode = false;
      this.form.controls.password.disable();
      this.route.queryParamMap
        .pipe(
          // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
          switchMap(() => {
            const id = this.authParams.auth;
            this.clientId = undefined;
            this.isLoading = true;
            if (id === undefined) {
              void this.router.navigate(['/login'], { replaceUrl: true });
              return of(undefined);
            }
            // Si el perfil no carga se muestra la pantalla de error (404, 500…).
            return this.service
              .getById(id)
              .pipe(catchErrorPage(this.router, this.route));
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((client) => {
          if (client) {
            this.fillForm(client);
          }
          this.isLoading = false;
        });
      return;
    }
    this.route.paramMap.pipe(
      switchMap((params) => {
        const idParam = params.get('id');
        this.isCreateMode = idParam === null;
        this.clientId = undefined;
        this.form.reset();
        this.form.controls.password.enable();
        this.isLoading = !this.isCreateMode;
        if (this.isCreateMode) {
          return of(undefined);
        }
        this.form.controls.password.disable();
        const id = Number(idParam);
        if (!Number.isSafeInteger(id) || id <= 0) {
          showErrorPage(this.router, this.route, 400);
          return EMPTY;
        }
        return this.service.getById(id).pipe(catchErrorPage(this.router, this.route));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((client) => {
      if (client) {
        this.fillForm(client);
      }
      this.isLoading = false;
    });
  }

  private fillForm(client: ClientDetailDTO): void {
    this.clientId = client.clientId;
    this.form.patchValue({
      name: client.name,
      lastName: client.lastName,
      nationalId: client.nationalId,
      phone: client.phone,
      email: client.email,
      profilePhoto: client.profilePhoto ?? '',
    });
  }

  save(): void {
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    this.submitted = true;
    this.saveError = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving || this.isLoading) {
      return EMPTY;
    }
    const value = this.form.getRawValue();
    const profilePhoto = value.profilePhoto.trim();
    const data = {
      name: value.name.trim(),
      lastName: value.lastName.trim(),
      nationalId: value.nationalId.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      ...(profilePhoto ? { profilePhoto } : {}),
    };
    if (!this.isCreateMode && this.clientId === undefined) {
      return EMPTY;
    }
    this.isSaving = true;
    if (this.isCreateMode) {
      return this.service.add({ ...data, password: value.password }).pipe(
        tap(() => {
          void this.router.navigate([this.base, 'clients'], {
            queryParams: { created: true },
          });
        }),
        catchError((error: HttpErrorResponse) => {
          this.showSaveError(error);
          return EMPTY;
        }),
      );
    } else if (this.clientId !== undefined) {
      const id = this.clientId;
      // La edición no envía contraseña: el backend conserva la guardada.
      const client: ClientDetailDTO = { ...data, clientId: id };
      return this.service.update(id, client).pipe(
        tap(() => {
          if (this.isProfile) {
            void this.router.navigate(['/profile'], {
              queryParams: { ...this.authParams, saved: true },
            });
          } else {
            void this.router.navigate([this.base, 'clients', id], {
              queryParams: { saved: true },
            });
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.showSaveError(error);
          return EMPTY;
        }),
      );
    }
    return EMPTY;
  }

  // Los errores de campo del backend (correo o cédula ya registrados, formatos) se muestran bajo su campo.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = showApiErrors(this.form, error);
    this.isSaving = false;
  }
}
