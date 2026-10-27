import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject, fromEvent } from 'rxjs';

@Component({
  selector: 'app-hotel-video',
  imports: [TranslocoPipe],
  templateUrl: './hotel-video.component.html',
  styleUrl: './hotel-video.component.scss',
})
export class HotelVideoComponent implements AfterViewInit, OnDestroy {

  @ViewChild('hotelVideo') hotelVideo?: ElementRef<HTMLVideoElement>;
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly fullscreenChangeSubject = new Subject<boolean>();
  @Output('fullscreenChange') readonly fullscreenChange$ = this.fullscreenChangeSubject.asObservable();

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private videoObserver?: IntersectionObserver;
  private hasStarted = false;
  private isInView = false;
  private isFullscreen = false;

  constructor() {
    // fromEvent convierte los eventos del navegador en un flujo que termina al destruir el componente.
    fromEvent(window, 'scroll').pipe(takeUntilDestroyed()).subscribe(() => this.updateFullscreen());
  }

  // Al entrar, el video solo empieza desde cero si aún no se ha reproducido o si ya terminó.
  ngAfterViewInit(): void {
    this.videoObserver = new IntersectionObserver(
      ([entry]) => {
        const visible =
          !!entry?.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible && !this.isInView) this.startVideo();
        this.isInView = visible;
      },
      { threshold: 0.2 },
    );
    this.videoObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
  }

  // Avisa a la landing cuando el video cubre toda la pantalla para ocultar el header.
  updateFullscreen(): void {
    const { top, bottom } =
      this.elementRef.nativeElement.getBoundingClientRect();
    const tolerance = this.isFullscreen ? 32 : 8;
    const isFullscreen =
      top <= tolerance && bottom >= window.innerHeight - tolerance;
    if (isFullscreen !== this.isFullscreen) {
      this.isFullscreen = isFullscreen;
      this.fullscreenChangeSubject.next(isFullscreen);
    }
  }

  private startVideo(): void {
    const video = this.hotelVideo?.nativeElement;
    if (!video || (this.hasStarted && !video.ended)) return;
    this.hasStarted = true;
    // Angular no aplica el atributo muted como propiedad. El navegador lo exige para reproducir solo.
    video.muted = true;
    video.playbackRate = 2;
    video.currentTime = 0;
    void video.play().catch(() => {
      this.hasStarted = false;
    });
  }
}
