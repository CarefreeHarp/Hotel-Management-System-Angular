import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { fromEvent } from 'rxjs';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { HotelVideoComponent } from './components/hotel-video/hotel-video.component';
import { LandingServicesComponent } from './components/landing-services/landing-services.component';
import { SuitesComponent } from './components/suites/suites.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    HeaderComponent,
    FooterComponent,
    HeroComponent,
    HotelVideoComponent,
    SuitesComponent,
    LandingServicesComponent,
    TranslocoPipe,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {

  scrollProgress: number = 0;
  isHeaderHidden: boolean = false;

  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private fadeObserver?: IntersectionObserver;

  constructor() {
    fromEvent(window, 'scroll').pipe(takeUntilDestroyed()).subscribe(() => this.updateScrollProgress());
  }

  // Los elementos con la clase fade-in aparecen una sola vez al entrar en pantalla.
  ngAfterViewInit(): void {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    this.elementRef.nativeElement
      .querySelectorAll('.fade-in')
      .forEach((element) => fadeObserver.observe(element));
    this.fadeObserver = fadeObserver;
  }

  ngOnDestroy(): void {
    this.fadeObserver?.disconnect();
  }
  updateScrollProgress(): void {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress =
      maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  }
}
