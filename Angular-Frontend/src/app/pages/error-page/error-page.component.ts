import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { HeaderComponent } from '../../components/header/header.component';
import { basePath } from '../../utils/base-path';
import { clientQuery } from '../../utils/client-query';
import { ErrorPageCode } from '../../utils/error-page';

// Los textos de cada código están en errorPage.labels, titles y messages de los archivos de traducción.
// 400 y 404 son problemas de la dirección. 500 y 503, del servidor.
function toCode(value: unknown): ErrorPageCode {
  const code = Number(value);
  return code === 400 || code === 500 || code === 503 ? code : 404;
}

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, HeaderComponent, AdminHeaderComponent, ButtonComponent, TranslocoPipe],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  // /error/500 trae el código en la ruta. Las rutas inexistentes, en sus datos (404).
  readonly code = toCode(
    this.route.snapshot.paramMap.get('code') ??
      this.route.snapshot.data['code'],
  );
  readonly serverError = this.code >= 500;
  readonly home = basePath(this.route);
  readonly staffArea = this.home !== '/';
  readonly homeLabelKey = this.route.snapshot.paramMap.has('operatorId')
    ? 'errorPage.goToFrontDesk'
    : this.staffArea
      ? 'errorPage.goToAdminPanel'
      : 'errorPage.goToHome';

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
