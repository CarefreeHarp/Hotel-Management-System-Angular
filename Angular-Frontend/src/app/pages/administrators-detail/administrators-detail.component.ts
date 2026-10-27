import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { AdministratorDTO } from '../../models/dto/administrator-dto';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { AdministratorService } from '../../services/administrator.service';
import { OperatorService } from '../../services/operator.service';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';
import { AdministratorInfoComponent } from './components/administrator-info/administrator-info.component';
import { AssignedOperatorsComponent } from './components/assigned-operators/assigned-operators.component';

@Component({
  selector: 'app-administrators-detail',
  imports: [
    SkeletonComponent,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    AdministratorInfoComponent,
    AssignedOperatorsComponent,
    TranslocoPipe,
  ],
  templateUrl: './administrators-detail.component.html',
  styleUrl: './administrators-detail.component.scss',
})
export class AdministratorsDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly administratorService = inject(AdministratorService);
  private readonly operatorService = inject(OperatorService);
  get base(): string {
    return basePath(this.route);
  }
  item: AdministratorDTO | undefined;
  operators: OperatorDTO[] = [];
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
    const id = Number(params.get('id'));
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda (404, 500…).
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return EMPTY;
    }
    // Primero llega el administrador y después se piden sus operadores.
    return this.administratorService
      .getById(id)
      .pipe(
        switchMap((administrator) => {
          this.item = administrator;
          return this.operatorService.getByAdministrator(id);
        }),
      ).pipe(
        tap((operators) => {
          this.operators = operators;
          this.isLoading = false;
        }),
        catchError((error: unknown) => {
          showErrorPage(this.router, this.route, errorPageCode(error));
          return EMPTY;
        }),
      );
  }
}
