import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { RoomTypeService } from '../../../../services/room-type.service';
import { clientQuery } from '../../../../utils/client-query';

@Component({
  selector: 'app-suites',
  imports: [OptimizedImageDirective, RouterLink],
  templateUrl: './suites.component.html',
  styleUrl: './suites.component.scss',
})
export class SuitesComponent implements OnInit {
  private roomTypeService = inject(RoomTypeService);
  private readonly route = inject(ActivatedRoute);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  roomTypes: RoomTypeListDTO[] = [];
  error = '';
  description: string =
    'Our rooms and suites are designed as serene private retreats, pairing generous spaces, handcrafted details and refined comforts with the calm of the coast. Every stay is shaped for deep rest, quiet mornings and effortless luxury.';

  // Posición del carrusel y cantidad de tarjetas visibles según el ancho de pantalla.
  suiteIndex: number = 0;
  visibleCount: number = this.getVisibleCount();

  ngOnInit(): void {
    this.roomTypeService.getAll().subscribe({
      next: (data) => {
        this.roomTypes = data;
      },
      // Es una sección del landing: el aviso se muestra en ella y el resto de la página sigue.
      error: () => {
        this.error = 'Suites could not be loaded.';
      },
    });
  }

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
