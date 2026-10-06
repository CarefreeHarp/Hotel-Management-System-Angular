import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { Service } from '../../../../models/service';

@Component({
  selector: 'app-service-info',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './service-info.component.html',
  styleUrl: './service-info.component.scss',
})
export class ServiceInfoComponent {
  @Input({ required: true }) service!: Service;
}
