import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Service } from '../../../../models/service';

@Component({
  selector: 'app-service-table',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './service-table.component.html',
  styleUrl: './service-table.component.scss',
})
export class ServiceTableComponent {
  @Input({ required: true }) services: Service[] = [];
  @Output() delete = new EventEmitter<Service>();
}
