import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OperatorInfoComponent } from './components/operator-info/operator-info.component';
import { OperatorService } from '../../services/operator.service';
import { OperatorDTO } from '../../models/dto/operator-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-operators-detail',
  imports: [
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
  private readonly operatorService = inject(OperatorService);
  readonly base = basePath(this.route);
  readonly isOperatorProfile=this.route.snapshot.paramMap.has('operatorId');
  item: OperatorDTO | undefined;
  isLoading = true;
  saved = false;

  ngOnInit(): void {
    const id = Number((this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('operatorId')));
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.isLoading = false;
      return;
    }
    // La respuesta ya incluye la id y el nombre del administrador a cargo.
    this.operatorService.getById(id).subscribe({
      next: (operator) => {
        this.item = operator;
        this.isLoading = false;
      },
      // El backend también responde con error cuando el id no existe.
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
