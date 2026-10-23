import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, concatMap, exhaustMap, tap, timer } from 'rxjs';
import { ButtonComponent } from '../../components/button/button.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import {
  apiErrorMessage,
  clearApiErrors,
  showApiErrors,
} from '../../utils/api-error';
import { CLIENT_MESSAGES, LOGIN_MESSAGES } from '../../utils/form-messages';
import {
  emailAddress,
  nationalId,
  phoneNumber,
  photoUrl,
  requiredText,
} from '../../utils/form-validators';

/** Coordina los formularios de acceso y registro. AuthService verifica las credenciales. */
@Component({
  selector: 'app-auth-page',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    FormFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent implements OnInit {

  private readonly submitSubject = new Subject<'client-login' | 'client-register' | 'staff-login'>();
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);

  activePortal: 'client' | 'staff' = 'client';
  clientMode: 'login' | 'register' = 'login';

  // Los tres formularios existen desde la construcción. Sus valores de texto nunca son null.
  readonly clientLoginForm = this.fb.group({
    email: ['', [requiredText, emailAddress, Validators.maxLength(100)]],
    password: ['', [Validators.required]],
  });

  readonly clientRegisterForm = this.fb.group({
    name: ['', [requiredText, Validators.maxLength(60)]],
    lastName: ['', [requiredText, Validators.maxLength(60)]],
    nationalId: ['', [requiredText, nationalId]],
    phone: ['', [requiredText, phoneNumber]],
    email: ['', [requiredText, Validators.maxLength(100), emailAddress]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255),
      ],
    ],
    profilePhoto: ['', [Validators.maxLength(500), photoUrl]],
  });

  readonly staffLoginForm = this.fb.group({
    email: ['', [requiredText, emailAddress, Validators.maxLength(100)]],
    password: ['', [Validators.required]],
  });

  clientLoginSubmitted = false;
  clientRegisterSubmitted = false;
  staffLoginSubmitted = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  protected readonly loginMessages = LOGIN_MESSAGES;
  protected readonly clientMessages = CLIENT_MESSAGES;

  constructor() {
    // Un solo flujo evita enviar dos formularios a la vez. Cada error se resuelve dentro de su petición.
    this.submitSubject.pipe(
      exhaustMap((action) => {
        if (action === 'client-login') return this.loginClient();
        if (action === 'client-register') return this.registerClient();
        return this.loginStaff();
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const portalParam = params.get('portal');
        const modeParam = params.get('mode');

        if (portalParam === 'staff') {
          this.activePortal = 'staff';
        } else if (portalParam === 'client') {
          this.activePortal = 'client';
        }

        if (modeParam === 'register') {
          this.clientMode = 'register';
        } else if (modeParam === 'login') {
          this.clientMode = 'login';
        }
      });
  }

  setPortal(portal: 'client' | 'staff'): void {
    this.activePortal = portal;
    this.errorMessage = '';
    this.successMessage = '';
  }

  setClientMode(mode: 'login' | 'register'): void {
    this.clientMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitClientLogin(): void {
    this.submitSubject.next('client-login');
  }

  private loginClient(): Observable<unknown> {
    this.clientLoginSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.clientLoginForm.invalid) {
      return EMPTY;
    }

    this.isLoading = true;
    const { email, password } = this.clientLoginForm.getRawValue();

    return this.authService.loginClient(email, password).pipe(
      tap((client) => {
        this.isLoading = false;
        this.successMessage = `Welcome, ${client.name}!`;
      }),
      // concatMap espera la pausa del mensaje antes de navegar. La espera termina al salir de la página.
      concatMap((client) => timer(800).pipe(tap(() => {
        void this.router.navigate(['/profile'], {
          queryParams: { auth: client.clientId },
        });
      }))),
      catchError((err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Sign-in failed.';

        return EMPTY;
      }),
    );
  }

  submitClientRegister(): void {
    this.submitSubject.next('client-register');
  }

  private registerClient(): Observable<unknown> {
    this.clientRegisterSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    clearApiErrors(this.clientRegisterForm);

    if (this.clientRegisterForm.invalid) {
      return EMPTY;
    }

    this.isLoading = true;
    const registration = this.clientRegisterForm.getRawValue();

    const profilePhoto = registration.profilePhoto.trim();
    const payload = {
      name: registration.name.trim(),
      lastName: registration.lastName.trim(),
      nationalId: registration.nationalId.trim(),
      phone: registration.phone.trim(),
      email: registration.email.trim(),
      password: registration.password,
      ...(profilePhoto ? { profilePhoto } : {}),
    };

    return this.authService.registerClient(payload).pipe(
      tap((createdClient) => {
        this.isLoading = false;
        this.successMessage = `Account created successfully! Welcome, ${createdClient.name}.`;

      }),
      concatMap((createdClient) => timer(1000).pipe(tap(() => {
        void this.router.navigate(['/profile'], {
          queryParams: { auth: createdClient.clientId },
        });
      }))),
      catchError((err: unknown) => {
        this.isLoading = false;
        this.errorMessage =
          err instanceof HttpErrorResponse
            ? showApiErrors(this.clientRegisterForm, err) ||
            'Please check the highlighted fields.'
            : apiErrorMessage(err, 'Guest registration failed.');

        return EMPTY;
      }),
    );
  }

  submitStaffLogin(): void {
    this.submitSubject.next('staff-login');
  }

  private loginStaff(): Observable<unknown> {
    this.staffLoginSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.staffLoginForm.invalid) {
      return EMPTY;
    }

    this.isLoading = true;
    const { email, password } = this.staffLoginForm.getRawValue();

    return this.authService.loginStaff(email, password).pipe(
      tap((staff) => {
        this.isLoading = false;
        const roleLabel =
          staff.role === 'ADMINISTRATOR' ? 'Administrator' : 'Operator';
        this.successMessage = `Access granted as ${roleLabel}: ${staff.name}.`;

      }),
      concatMap((staff) => timer(800).pipe(tap(() => {
        this.router.navigate(
          staff.role === 'ADMINISTRATOR'
            ? ['/admin', staff.id]
            : ['/operator', staff.id],
        );
      }))),
      catchError((err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Staff sign-in failed.';

        return EMPTY;
      }),
    );
  }

  fillDemoClient(): void {
    this.activePortal = 'client';
    this.clientMode = 'login';
    this.clientLoginForm.patchValue({
      email: 'emma.thompson@example.com',
      password: 'Emma2026!',
    });
  }

  fillDemoAdmin(): void {
    this.activePortal = 'staff';
    this.staffLoginForm.patchValue({
      email: 'admin1@atlansuites.com',
      password: 'Admin2026!',
    });
  }

  fillDemoOperator(): void {
    this.activePortal = 'staff';
    this.staffLoginForm.patchValue({
      email: 'operator1@atlansuites.com',
      password: 'Operator2026!',
    });
  }
}
