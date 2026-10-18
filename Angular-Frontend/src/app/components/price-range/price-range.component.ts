import { CurrencyPipe } from '@angular/common';
import { Component, Input, output } from '@angular/core';
@Component({
  selector: 'app-price-range',
  imports: [CurrencyPipe],
  templateUrl: './price-range.component.html',
  styleUrl: './price-range.component.scss',
})
export class PriceRangeComponent {
  @Input({ required: true }) floor: number = 0;
  @Input({ required: true }) limit: number = 0;
  @Input() minimum = 0;
  @Input({ required: true }) maximum: number = 0;
  readonly changed = output<{ minimum: number; maximum: number }>();
  changeMinimum(control: HTMLInputElement): void {
    const minimum = Math.min(Number(control.value), this.maximum);
    control.value = String(minimum);
    this.changed.emit({ minimum, maximum: this.maximum });
  }
  changeMaximum(control: HTMLInputElement): void {
    const maximum = Math.max(Number(control.value), this.minimum);
    control.value = String(maximum);
    this.changed.emit({ minimum: this.minimum, maximum });
  }
  get start(): number {
    const span = this.limit - this.floor;
    return span ? (100 * (this.minimum - this.floor)) / span : 0;
  }
  get end(): number {
    const span = this.limit - this.floor;
    return span ? (100 * (this.maximum - this.floor)) / span : 100;
  }
}
