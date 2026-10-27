import { Component, inject, Input, Output } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { ClientListDTO } from '../../../../models/dto/client-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-client-table',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './client-table.component.html',
  styleUrl: './client-table.component.scss',
})
export class ClientTableComponent {
  @Input() clients: ClientListDTO[] = [];
  protected readonly deleteSubject = new Subject<ClientListDTO>();
  @Output('delete') readonly delete$ = this.deleteSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
