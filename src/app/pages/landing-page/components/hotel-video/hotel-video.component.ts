import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnDestroy, Output, ViewChild, inject } from '@angular/core';

@Component({
  selector: 'app-hotel-video',
  imports: [],
  templateUrl: './hotel-video.component.html',
  styleUrl: './hotel-video.component.scss'
})
export class HotelVideoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hotelVideo') hotelVideo!: ElementRef<HTMLVideoElement>;
  @Output() fullscreenChange = new EventEmitter<boolean>();

  eyebrow: string = 'The hotel';
  title: string = 'Hotel drone view';
  videoLabel: string = 'Aerial view of Atlan Suites in Singapore';

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private videoObserver?: IntersectionObserver;
  private hasStarted = false;
  private isFullscreen = false;

  // El video se reproduce una sola vez, cuando la sección entra en pantalla.
  ngAfterViewInit(): void {
    this.videoObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) this.startVideo();
    }, { threshold: 0.2 });
    this.videoObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
  }

  // Avisa a la landing cuando el video cubre toda la pantalla para ocultar el header.
  @HostListener('window:scroll')
  updateFullscreen(): void {
    const { top, bottom } = this.elementRef.nativeElement.getBoundingClientRect();
    const isFullscreen = top <= 1 && bottom >= window.innerHeight - 1;
    if (isFullscreen !== this.isFullscreen) {
      this.isFullscreen = isFullscreen;
      this.fullscreenChange.emit(isFullscreen);
    }
  }

  private startVideo(): void {
    if (this.hasStarted) return;
    this.hasStarted = true;
    const video = this.hotelVideo.nativeElement;
    // Angular no aplica el atributo muted como propiedad; el navegador lo exige para reproducir solo.
    video.muted = true;
    video.playbackRate = 2;
    video.currentTime = 0;
    video.play().catch(() => {});
  }
}
