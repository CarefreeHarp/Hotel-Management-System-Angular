import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-page-heading',
  imports: [TranslocoPipe],
  templateUrl: './page-heading.component.html',
  styleUrl: './page-heading.component.scss',
})
export class PageHeadingComponent {
  // Texto ya traducido. Sin valor se muestra el título genérico del catálogo.
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() description = '';
}
