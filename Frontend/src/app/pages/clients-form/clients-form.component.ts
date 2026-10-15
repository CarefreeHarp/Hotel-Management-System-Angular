import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { HeaderComponent } from '../../components/header/header.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientFieldsComponent } from './components/client-fields/client-fields.component';
import { ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth.service';
import { basePath } from '../../utils/base-path';

export type ClientForm = FormGroup<{
  name: FormControl<string>;
  lastName: FormControl<string>;
  nationalId: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  profilePhoto: FormControl<string>;
}>;

function requiredText(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function photoUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !/\s/.test(value) ? null : { photoUrl: true };
  } catch {
    return { photoUrl: true };
  }
}

@Component({
  selector: 'app-clients-form',
  imports: [
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
  private readonly authService = inject(AuthService);
  // /admin/:adminId en el CRUD o /client/:clientId cuando el cliente edita su perfil.
  readonly base = basePath(this.route);
  clientId: number | undefined;
  isCreateMode = true;
  // En /client/:clientId/profile/edit el cliente edita su propia cuenta y vuelve a su perfil.
  isProfile = false;
  isLoading = false;
  isSaving = false;
  submitted = false;
  loadError = '';
  saveError = '';
  readonly form: ClientForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(60)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(60)] }),
    nationalId: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(20)] }),
    phone: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.maxLength(20)] }),
    email: new FormControl('', { nonNullable: true, validators: [requiredText, Validators.email, Validators.maxLength(100)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(255)] }),
    profilePhoto: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500), photoUrl] }),
  });

  ngOnInit(): void {
    this.isProfile = this.route.snapshot.data['profile'] === true;
    // En el perfil la id es la del cliente que viene en la URL (/client/:clientId).
    const idParam = this.route.snapshot.paramMap.get(this.isProfile ? 'clientId' : 'id');
    this.isCreateMode = idParam === null;
    if (this.isCreateMode) return;
    this.form.controls.password.disable();
    const id = Number(idParam);
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.loadError = 'Invalid client ID.';
      return;
    }
    this.clientId = id;
    // En el perfil el guard ya trajo este cliente del backend con la id de la URL:
    // se usan esos datos y no se repite GET /clients/{id}.
    const sessionClient = this.authService.session()?.client;
    if (this.isProfile && sessionClient?.clientId === id) {
      this.fillForm(sessionClient);
      return;
    }
    this.loadClient(id);
  }

  private loadClient(id: number): void {
    this.isLoading = true;
    this.service.getById(id).subscribe({
      next: (client) => {
        this.fillForm(client);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'The client could not be loaded. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private fillForm(client: ClientDetailDTO): void {
    this.clientId = client.clientId;
    this.form.patchValue({
      name: client.name, lastName: client.lastName, nationalId: client.nationalId,
      phone: client.phone, email: client.email, profilePhoto: client.profilePhoto ?? '',
    });
  }

  save(): void {
    this.submitted = true;
    this.saveError = '';
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving || this.isLoading || this.loadError) return;
    const value = this.form.getRawValue();
    const profilePhoto = value.profilePhoto.trim();
    const data = {
      name: value.name.trim(), lastName: value.lastName.trim(), nationalId: value.nationalId.trim(),
      phone: value.phone.trim(), email: value.email.trim(),
      ...(profilePhoto ? { profilePhoto } : {}),
    };
    if (!this.isCreateMode && this.clientId === undefined) return;
    this.isSaving = true;
    if (this.isCreateMode) {
      this.service.add({ ...data, password: value.password }).subscribe({
        next: () => { void this.router.navigate([this.base, 'clients'], { queryParams: { created: true } }); },
        error: (error: HttpErrorResponse) => this.showSaveError(error),
      });
    } else if (this.clientId !== undefined) {
      const id = this.clientId;
      // La edición no envía contraseña: el backend conserva la guardada.
      const client: ClientDetailDTO = { ...data, clientId: id };
      this.service.update(id, client).subscribe({
        next: () => {
          if (this.isProfile) {
            this.authService.updateClient(client);
            void this.router.navigate([this.base, 'profile'], { queryParams: { saved: true } });
          } else {
            void this.router.navigate([this.base, 'clients', id], { queryParams: { saved: true } });
          }
        },
        error: (error: HttpErrorResponse) => this.showSaveError(error),
      });
    }
  }

  // Si el correo o la cédula ya existen, el backend responde 409 y su mensaje se muestra aquí.
  private showSaveError(error: HttpErrorResponse): void {
    this.saveError = error.error?.message || 'The client could not be saved. Please try again.';
    this.isSaving = false;
  }
}
