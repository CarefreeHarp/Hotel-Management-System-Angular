import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-hotel-video',
  imports: [],
  templateUrl: './hotel-video.component.html',
  styleUrl: './hotel-video.component.scss',
})
export class HotelVideoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hotelVideo') hotelVideo?: ElementRef<HTMLVideoElement>;
  @Output() fullscreenChange = new EventEmitter<boolean>();

  eyebrow: string = 'The hotel';
  title: string = 'Hotel drone view';
  videoLabel: string = 'Aerial view of Atlan Suites in Singapore';

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private videoObserver?: IntersectionObserver;
  private hasStarted = false;
  private isInView = false;
  private isFullscreen = false;

  // Entering starts a new playback only before the first run or after completion.
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
  @HostListener('window:scroll')
  updateFullscreen(): void {
    const { top, bottom } =
      this.elementRef.nativeElement.getBoundingClientRect();
    const tolerance = this.isFullscreen ? 32 : 8;
    const isFullscreen =
      top <= tolerance && bottom >= window.innerHeight - tolerance;
    if (isFullscreen !== this.isFullscreen) {
      this.isFullscreen = isFullscreen;
      this.fullscreenChange.emit(isFullscreen);
    }
  }

  private startVideo(): void {
    const video = this.hotelVideo?.nativeElement;
    if (!video || (this.hasStarted && !video.ended)) return;
    this.hasStarted = true;
    // Angular no aplica el atributo muted como propiedad; el navegador lo exige para reproducir solo.
    video.muted = true;
    video.playbackRate = 2;
    video.currentTime = 0;
    void video.play().catch(() => {
      this.hasStarted = false;
    });
  }
}
