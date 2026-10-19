import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OperatorInfoComponent } from './components/operator-info/operator-info.component';
import { OperatorService } from '../../services/operator.service';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-operators-detail',
  imports: [
    SkeletonComponent,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    OperatorInfoComponent,
  ],
  templateUrl: './operators-detail.component.html',
  styleUrl: './operators-detail.component.scss',
})
export class OperatorsDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly operatorService = inject(OperatorService);
  get base(): string {
    return basePath(this.route);
  }
  readonly isOperatorProfile = this.route.snapshot.paramMap.has('operatorId');
  item: OperatorDTO | undefined;
  isLoading = true;
  saved = false;

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id') ??
        this.route.snapshot.paramMap.get('operatorId'),
    );
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    // Una id inválida muestra la pantalla 400; si la carga falla, la que corresponda (404, 500…).
    // También aplica a /operator/:operatorId, que es el perfil del propio operador.
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return;
    }
    // La respuesta ya incluye la id y el nombre del administrador a cargo.
    this.operatorService.getById(id).subscribe({
      next: (operator) => {
        this.item = operator;
        this.isLoading = false;
      },
      // El backend responde 404 cuando el id no existe.
      error: (error: unknown) =>
        showErrorPage(this.router, this.route, errorPageCode(error)),
    });
  }
}
