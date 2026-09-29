import { Component, Input } from '@angular/core';

// Se usa sobre un <a> o <button>: <a appButton variant="secondary">.
@Component({
  selector: 'a[appButton], button[appButton]',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  host: { '[class.is-secondary]': "variant === 'secondary'" }
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
}
