import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mergeMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { AdministratorInfoComponent } from './components/administrator-info/administrator-info.component';
import { AssignedOperatorsComponent } from './components/assigned-operators/assigned-operators.component';
import { AdministratorService } from '../../services/administrator.service';
import { OperatorService } from '../../services/operator.service';
import { AdministratorDTO } from '../../models/dto/administrator-dto';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

@Component({
  selector: 'app-administrators-detail',
  imports: [
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    AdministratorInfoComponent,
    AssignedOperatorsComponent,
  ],
  templateUrl: './administrators-detail.component.html',
  styleUrl: './administrators-detail.component.scss',
})
export class AdministratorsDetailComponent implements OnInit {
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    // Una id inválida muestra la pantalla 400; si la carga falla, la que corresponda (404, 500…).
    if (!Number.isSafeInteger(id) || id <= 0) {
      showErrorPage(this.router, this.route, 400);
      return;
    }
    // Primero llega el administrador y después se piden sus operadores.
    this.administratorService
      .getById(id)
      .pipe(
        mergeMap((administrator) => {
          this.item = administrator;
          return this.operatorService.getByAdministrator(id);
        }),
      )
      .subscribe({
        next: (operators) => {
          this.operators = operators;
          this.isLoading = false;
        },
        // El backend responde 404 cuando el id no existe.
        error: (error: unknown) =>
          showErrorPage(this.router, this.route, errorPageCode(error)),
      });
  }
}
