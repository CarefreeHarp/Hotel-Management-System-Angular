import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-title',
  imports: [RouterLink, CommonModule],
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.scss'
})
export class PageTitleComponent {
  @Input() totalCount = 0;
  @Input() avgPrice = 0;
  @Input() maxCapacity = 0;
  @Input() minCapacity = 0;
}
