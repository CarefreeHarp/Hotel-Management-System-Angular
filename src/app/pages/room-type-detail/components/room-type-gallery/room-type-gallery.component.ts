import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-room-type-gallery',
  templateUrl: './room-type-gallery.component.html',
  styleUrl: './room-type-gallery.component.scss'
})
export class RoomTypeGalleryComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) photos: string[] = [];
}
