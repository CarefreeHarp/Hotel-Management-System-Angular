import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../components/button/button.component';
import { RoomTypeDetailDTO } from '../../../../models/dto/room-type-detail-dto';
import { basePath } from '../../../../utils/base-path';

@Component({
  selector: 'app-room-type-info',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  templateUrl: './room-type-info.component.html',
  styleUrl: './room-type-info.component.scss',
})
export class RoomTypeInfoComponent {
  @Input({ required: true }) roomType!: RoomTypeDetailDTO;
  readonly base = basePath(inject(ActivatedRoute));
}
