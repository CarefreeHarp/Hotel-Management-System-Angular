import { Component, HostListener, inject } from '@angular/core';
import { RoomType } from '../../../../models/room-type';
import { RoomTypeService } from '../../../../services/room-type.service';

@Component({
  selector: 'app-suites',
  imports: [],
  templateUrl: './suites.component.html',
  styleUrl: './suites.component.scss'
})
export class SuitesComponent {
  private roomTypeService = inject(RoomTypeService);

  roomTypes: RoomType[] = this.roomTypeService.getAll();
  description: string = 'Our rooms and suites are designed as serene private retreats, pairing generous spaces, handcrafted details and refined comforts with the calm of the coast. Every stay is shaped for deep rest, quiet mornings and effortless luxury.';

  // Posición del carrusel y cantidad de tarjetas visibles según el ancho de pantalla.
  suiteIndex: number = 0;
  visibleCount: number = this.getVisibleCount();

  get maxIndex(): number {
    return Math.max(0, this.roomTypes.length - this.visibleCount);
  }

  // Cada paso mueve el ancho de una tarjeta más el espacio entre tarjetas (1.5rem).
  get trackTransform(): string {
    return `translateX(calc(-${this.suiteIndex} * (100% + 1.5rem) / ${this.visibleCount}))`;
  }

  previous(): void {
    this.suiteIndex = Math.max(0, this.suiteIndex - 1);
  }

  next(): void {
    this.suiteIndex = Math.min(this.maxIndex, this.suiteIndex + 1);
  }

  @HostListener('window:resize')
  updateVisibleCount(): void {
    this.visibleCount = this.getVisibleCount();
    this.suiteIndex = Math.min(this.suiteIndex, this.maxIndex);
  }

  private getVisibleCount(): number {
    if (window.matchMedia('(min-width: 1024px)').matches) return 3;
    if (window.matchMedia('(min-width: 640px)').matches) return 2;
    return 1;
  }
}
