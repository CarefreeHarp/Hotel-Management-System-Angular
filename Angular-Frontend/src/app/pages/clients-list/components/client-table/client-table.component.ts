import { Component, inject, Input, Output } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { ClientListDTO } from '../../../../models/dto/client-list-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-client-table',
  imports: [RouterLink],
  templateUrl: './client-table.component.html',
  styleUrl: './client-table.component.scss',
})
export class ClientTableComponent {
  @Input() clients: ClientListDTO[] = [];
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly deleteSubject = new Subject<ClientListDTO>();
  @Output('delete') readonly delete$ = this.deleteSubject.asObservable();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
