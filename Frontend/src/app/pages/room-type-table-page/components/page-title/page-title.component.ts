import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { basePath, isAdminArea } from '../../../../utils/base-path';

@Component({
  selector: 'app-page-title',
  imports: [RouterLink, CommonModule],
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.scss',
})
export class PageTitleComponent {
  private readonly route = inject(ActivatedRoute);
  readonly base = basePath(this.route);
  readonly adminArea = isAdminArea(this.route);

  @Input() totalCount = 0;
  @Input() avgPrice = 0;
  @Input() maxCapacity = 0;
  @Input() minCapacity = 0;
}
