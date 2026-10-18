import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { ErrorPageCode } from '../../utils/error-page';

interface ErrorCopy {
  label: string;
  title: string;
  message: string;
}

// 400 y 404 son problemas de la dirección; 500 y 503, del servidor.
const COPY: Record<ErrorPageCode, ErrorCopy> = {
  400: {
    label: 'Invalid request',
    title: 'This address is not valid',
    message:
      'The link contains a value the hotel cannot read, such as an identifier that is not a number. Check the address or go back.',
  },
  404: {
    label: 'Not found',
    title: 'We could not find this page',
    message:
      'The page or record you are looking for does not exist or was removed.',
  },
  500: {
    label: 'Server error',
    title: 'Something went wrong on our side',
    message:
      'The server could not complete the request. Please try again in a few moments.',
  },
  503: {
    label: 'Server unavailable',
    title: 'We cannot reach the server',
    message:
      'The hotel server is not responding. Check your connection and try again shortly.',
  },
};

function toCode(value: unknown): ErrorPageCode {
  const code = Number(value);
  return code === 400 || code === 500 || code === 503 ? code : 404;
}

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, HeaderComponent, AdminHeaderComponent, ButtonComponent],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  // /error/500 trae el código en la ruta; las rutas inexistentes, en sus datos (404).
  readonly code = toCode(
    this.route.snapshot.paramMap.get('code') ??
      this.route.snapshot.data['code'],
  );
  readonly copy = COPY[this.code];
  readonly serverError = this.code >= 500;
  readonly home = basePath(this.route);
  readonly staffArea = this.home !== '/';
  readonly homeLabel = this.route.snapshot.paramMap.has('operatorId')
    ? 'Go to my profile'
    : this.staffArea
      ? 'Go to the admin panel'
      : 'Go to the home page';

  // La barra de direcciones conserva la página que falló.
  get address(): string {
    return this.location.path() || '/';
  }

  get homeParams(): { auth?: number } {
    return this.staffArea ? {} : clientQuery(this.route);
  }

  // Vuelve a pedir la página original, que sigue en la barra de direcciones.
  retry(): void {
    void this.router.navigateByUrl(this.address);
  }

  back(): void {
    this.location.back();
  }
}
