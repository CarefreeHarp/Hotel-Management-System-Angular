import { Component, Input } from '@angular/core';

// Administradores y operadores no tienen foto: se muestran sus iniciales.
@Component({
  selector: 'app-staff-avatar',
  templateUrl: './staff-avatar.component.html',
  styleUrl: './staff-avatar.component.scss',
  host: {
    'aria-hidden': 'true',
    '[class.is-gold]': "tone === 'gold'",
    '[class.is-large]': "size === 'large'",
  },
})
export class StaffAvatarComponent {
  @Input({ required: true }) name = '';
  @Input() tone: 'sky' | 'gold' = 'sky';
  @Input() size: 'small' | 'large' = 'small';

  get initials(): string {
    const letters = this.name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .filter((letter) => /\p{L}/u.test(letter));
    return letters.slice(0, 2).join('').toUpperCase() || '?';
  }
}
