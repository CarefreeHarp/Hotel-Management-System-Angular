import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { ServiceDetailDTO } from '../../../../models/dto/service-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-service-info',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './service-info.component.html',
  styleUrl: './service-info.component.scss',
})
export class ServiceInfoComponent {
  @Input({ required: true }) service!: ServiceDetailDTO;
  readonly base = basePath(inject(ActivatedRoute));
}
