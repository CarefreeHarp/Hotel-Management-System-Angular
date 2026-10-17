import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { ButtonComponent } from '../../components/button/button.component';

@Component({
  selector: 'app-auth-page',
  imports: [
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
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);

  activePortal: 'client' | 'staff' = 'client';
  clientMode: 'login' | 'register' = 'login';

  clientLoginForm!: FormGroup;
  clientRegisterForm!: FormGroup;
  staffLoginForm!: FormGroup;

  clientLoginSubmitted = false;
  clientRegisterSubmitted = false;
  staffLoginSubmitted = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.initForms();

    this.route.queryParamMap.subscribe((params) => {
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

  private initForms(): void {
    this.clientLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.clientRegisterForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      lastName: ['', [Validators.required, Validators.maxLength(60)]],
      nationalId: ['', [Validators.required, Validators.maxLength(20)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      profilePhoto: ['', [Validators.maxLength(500)]],
    });

    this.staffLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
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
    this.clientLoginSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.clientLoginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.clientLoginForm.value;

    this.authService.loginClient(email, password).subscribe({
      next: (client) => {
        this.isLoading = false;
        this.successMessage = `Welcome, ${client.name}!`;
        // La id del cliente va en la URL: así el perfil sobrevive a una recarga.
        setTimeout(() => {
          this.router.navigate(['/client', client.clientId, 'profile']);
        }, 800);
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Sign-in failed.';
      },
    });
  }

  submitClientRegister(): void {
    this.clientRegisterSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.clientRegisterForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formVal = this.clientRegisterForm.value;

    const payload = {
      name: formVal.name.trim(),
      lastName: formVal.lastName.trim(),
      nationalId: formVal.nationalId.trim(),
      phone: formVal.phone.trim(),
      email: formVal.email.trim(),
      password: formVal.password,
      profilePhoto: formVal.profilePhoto?.trim() || undefined,
    };

    this.authService.registerClient(payload).subscribe({
      next: (createdClient) => {
        this.isLoading = false;
        this.successMessage = `Account created successfully! Welcome, ${createdClient.name}.`;
        setTimeout(() => {
          this.router.navigate(['/client', createdClient.clientId, 'profile']);
        }, 1000);
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Guest registration failed.';
      },
    });
  }

  submitStaffLogin(): void {
    this.staffLoginSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.staffLoginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.staffLoginForm.value;

    this.authService.loginStaff(email, password).subscribe({
      next: (staff) => {
        this.isLoading = false;
        const roleLabel = staff.role === 'ADMINISTRATOR' ? 'Administrator' : 'Operator';
        this.successMessage = `Access granted as ${roleLabel}: ${staff.name}.`;
        // El panel del administrador lleva su id en la URL, como /admin/panel/{id} en Thymeleaf.
        setTimeout(() => {
          this.router.navigate(staff.role === 'ADMINISTRATOR' ? ['/admin', staff.id] : ['/operator',staff.id]);
        }, 800);
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Staff sign-in failed.';
      },
    });
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
