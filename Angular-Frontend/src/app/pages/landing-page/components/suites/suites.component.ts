import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { fromEvent } from 'rxjs';
import { SkeletonComponent } from '../../../../components/skeleton/skeleton.component';
import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { RoomTypeListDTO } from '../../../../models/dto/room-type-list-dto';
import { RoomTypeService } from '../../../../services/room-type.service';
import { clientQuery } from '../../../../utils/client-query';

@Component({
  selector: 'app-suites',
  imports: [SkeletonComponent, OptimizedImageDirective, RouterLink, CurrencyPipe, TranslocoPipe],
  templateUrl: './suites.component.html',
  styleUrl: './suites.component.scss',
})
export class SuitesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  private roomTypeService = inject(RoomTypeService);
  private readonly route = inject(ActivatedRoute);
  get authParams(): { auth?: number } {
    return clientQuery(this.route);
  }

  roomTypes: RoomTypeListDTO[] = [];
  isLoading = true;
  // Clave de traducción del aviso de error de la sección.
  error = '';

  // Posición del carrusel y cantidad de tarjetas visibles según el ancho de pantalla.
  suiteIndex: number = 0;
  visibleCount: number = this.getVisibleCount();

  constructor() {
    fromEvent(window, 'resize').pipe(takeUntilDestroyed()).subscribe(() => this.updateVisibleCount());
  }

  ngOnInit(): void {
    this.roomTypeService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.roomTypes = data;
        this.isLoading = false;
      },
      // Es una sección del landing: el aviso se muestra en ella y el resto de la página sigue.
      error: () => {
        this.error = 'landing.suites.loadError';
        this.isLoading = false;
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
  updateVisibleCount(): void {
    this.visibleCount = this.getVisibleCount();
    this.suiteIndex = Math.min(this.suiteIndex, this.maxIndex);
  }

  private getVisibleCount(): number {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      return 3;
    }
    if (window.matchMedia('(min-width: 640px)').matches) {
      return 2;
    }
    return 1;
  }
}
