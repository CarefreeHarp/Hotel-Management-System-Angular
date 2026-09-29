import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { RoomType } from '../../../../models/room-type';

@Component({
  selector: 'app-room-type-info',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './room-type-info.component.html',
  styleUrl: './room-type-info.component.scss'
})
export class RoomTypeInfoComponent {
  @Input({ required: true }) roomType!: RoomType;
}
