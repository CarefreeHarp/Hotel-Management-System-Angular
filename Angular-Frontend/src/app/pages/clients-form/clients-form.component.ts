import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { switchMap, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientFieldsComponent } from './components/client-fields/client-fields.component';
import { ClientService } from '../../services/client.service';
import { clientQuery } from '../../utils/client-query';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { basePath } from '../../utils/base-path';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import {
  catchErrorPage,
  errorPageCode,
  showErrorPage,
} from '../../utils/error-page';
import {
  emailAddress,
  nationalId,
  phoneNumber,
  photoUrl,
  requiredText,
} from '../../utils/form-validators';

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
  ],
  templateUrl: './clients-form.component.html',
  styleUrl: './clients-form.component.scss',
})
export class ClientsFormComponent implements OnInit {
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
  // Profile mode reads the client identifier from the query string.
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

  ngOnInit(): void {
    this.isProfile = this.route.snapshot.data['profile'] === true;
    if (this.isProfile) {
      this.isCreateMode = false;
      this.form.controls.password.disable();
      this.route.queryParamMap
        .pipe(
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
          if (client) this.fillForm(client);
          this.isLoading = false;
        });
      return;
    }
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = idParam === null;
    if (this.isCreateMode) return;
    this.form.controls.password.disable();
    this.isLoading = true;
    const id = Number(idParam);
    // Una id inválida muestra la pantalla 400; si el cliente no carga, la que corresponda.
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return;
    }
    this.loadClient(id);
  }

  private loadClient(id: number): void {
    this.service.getById(id).subscribe({
      next: (client) => {
        this.fillForm(client);
        this.isLoading = false;
      },
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
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
    this.submitted = true;
    this.saveError = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving || this.isLoading) return;
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
    if (!this.isCreateMode && this.clientId === undefined) return;
    this.isSaving = true;
    if (this.isCreateMode) {
      this.service.add({ ...data, password: value.password }).subscribe({
        next: () => {
          void this.router.navigate([this.base, 'clients'], {
            queryParams: { created: true },
          });
        },
        error: (error: HttpErrorResponse) => this.showSaveError(error),
      });
    } else if (this.clientId !== undefined) {
      const id = this.clientId;
      // La edición no envía contraseña: el backend conserva la guardada.
      const client: ClientDetailDTO = { ...data, clientId: id };
      this.service.update(id, client).subscribe({
        next: () => {
          if (this.isProfile) {
            void this.router.navigate(['/profile'], {
              queryParams: { ...this.authParams, saved: true },
            });
          } else {
            void this.router.navigate([this.base, 'clients', id], {
              queryParams: { saved: true },
            });
          }
        },
        error: (error: HttpErrorResponse) => this.showSaveError(error),
      });
    }
  }

  // Los errores de campo del backend (correo o cédula ya registrados, formatos) se muestran bajo su campo.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = showApiErrors(this.form, error);
    this.isSaving = false;
  }
}
