import { Component, inject, Input, output } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  readonly delete = output<ClientListDTO>();
  private readonly route = inject(ActivatedRoute);
  get base(): string {
    return basePath(this.route);
  }
}
