import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-heading',
  templateUrl: './page-heading.component.html',
  styleUrl: './page-heading.component.scss'
})
export class PageHeadingComponent {
  @Input() eyebrow = 'Accommodation catalog';
  @Input({ required: true }) title = '';
  @Input() description = '';
}
