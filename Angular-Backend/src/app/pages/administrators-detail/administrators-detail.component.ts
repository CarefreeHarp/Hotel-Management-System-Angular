import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  private readonly administratorService = inject(AdministratorService);
  private readonly operatorService = inject(OperatorService);
  readonly base = basePath(this.route);
  item: AdministratorDTO | undefined;
  operators: OperatorDTO[] = [];
  isLoading = true;
  saved = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.isLoading = false;
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
        // El backend también responde con error cuando el id no existe.
        error: () => {
          this.isLoading = false;
        },
      });
  }
}
