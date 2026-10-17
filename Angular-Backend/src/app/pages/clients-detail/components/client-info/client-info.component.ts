import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { ClientDetailDTO } from '../../../../models/dto/client-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-client-info',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './client-info.component.html',
  styleUrl: './client-info.component.scss',
})
export class ClientInfoComponent {
  readonly client = input.required<ClientDetailDTO>();
  readonly base = basePath(inject(ActivatedRoute));
}
