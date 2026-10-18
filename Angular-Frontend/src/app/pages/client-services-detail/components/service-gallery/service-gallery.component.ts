import { OptimizedImageDirective } from '../../../../directives/optimized-image.directive';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
@Component({
  selector: 'app-service-gallery',
  imports: [OptimizedImageDirective],
  templateUrl: './service-gallery.component.html',
  styleUrl: './service-gallery.component.scss',
})
export class ServiceGalleryComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) mainPhoto = '';
  @Input() photos: string[] = [];
  @ViewChild('lightbox') lightbox?: ElementRef<HTMLDialogElement>;
  selectedPhoto = '';
  get images(): string[] {
    return [this.mainPhoto, ...this.photos].filter(Boolean);
  }
  open(photo: string): void {
    this.selectedPhoto = photo;
    this.lightbox?.nativeElement.showModal();
  }
  close(): void {
    this.lightbox?.nativeElement.close();
  }
  backdrop(event: MouseEvent): void {
    if (event.target === this.lightbox?.nativeElement) this.close();
  }
}
