import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { OperatorService } from '../../services/operator.service';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { OperatorInfoComponent } from './components/operator-info/operator-info.component';

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
  private readonly destroyRef = inject(DestroyRef);
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
    this.route.paramMap.pipe(
      // Cambiar de registro cancela sus lecturas anteriores y conserva solo el resultado vigente.
      switchMap((params) => this.loadRecord(params)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private loadRecord(params: ParamMap): Observable<unknown> {
    this.isLoading = true;
    this.item = undefined;
    const id = Number(
      params.get('id') ??
      params.get('operatorId'),
    );
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda (404, 500…).
    // También aplica a /operator/:operatorId, que es el perfil del propio operador.
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return EMPTY;
    }
    // La respuesta ya incluye la id y el nombre del administrador a cargo.
    return this.operatorService.getById(id).pipe(
      tap((operator) => {
        this.item = operator;
        this.isLoading = false;
      }),
      catchError((error: unknown) => {
        showErrorPage(this.router, this.route, errorPageCode(error));
        return EMPTY;
      }),
    );
  }
}
