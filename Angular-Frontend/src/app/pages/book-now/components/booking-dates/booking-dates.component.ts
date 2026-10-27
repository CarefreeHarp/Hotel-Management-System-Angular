import { AsyncPipe, DatePipe, formatDate } from '@angular/common';
import { Component, Input, LOCALE_ID, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { BehaviorSubject, map, Subject } from 'rxjs';
import {
  addDays,
  BookingStay,
  latestCheckIn,
  localDate,
  MAX_GUESTS,
  MAX_NIGHTS,
  MAX_YEARS_AHEAD,
  stayNights,
  validStay,
} from '../../../../models/booking';
interface CalendarDay {
  value: string;
  label: number;
  disabled: boolean;
}

interface CalendarMonth {
  title: string;
  days: CalendarDay[];
}

/** Construye el calendario y emite la estancia elegida. La disponibilidad la consulta el padre. */
@Component({
  selector: 'app-booking-dates',
  imports: [AsyncPipe, FormsModule, DatePipe, TranslocoPipe],
  templateUrl: './booking-dates.component.html',
  styleUrl: './booking-dates.component.scss',
})
export class BookingDatesComponent {
  @Input({ required: true }) stay: BookingStay = {
    checkIn: '',
    checkOut: '',
    guests: 1,
  };
  // El Subject emite desde este componente. El Observable expuesto permite al padre escuchar.
  protected readonly continueBookingSubject = new Subject<BookingStay>();
  @Output('continueBooking') readonly continueBooking$ = this.continueBookingSubject.asObservable();
  checkIn = '';
  checkOut = '';
  guests = 1;
  readonly today = localDate();
  // Mismos límites que el backend: llegada hasta dos años, estancia de hasta 90 noches.
  readonly lastCheckIn = latestCheckIn();
  readonly maxNights = MAX_NIGHTS;
  readonly maxGuests = MAX_GUESTS;
  readonly maxYears = MAX_YEARS_AHEAD;
  // Meses y días de la semana se escriben en el idioma elegido (LOCALE_ID).
  private readonly locale = inject(LOCALE_ID);
  // El 4 de enero de 2026 fue domingo: de ahí salen los siete nombres cortos en orden.
  readonly weekdays = Array.from({ length: 7 }, (_, index) =>
    formatDate(new Date(2026, 0, 4 + index), 'EEE', this.locale),
  );
  // BehaviorSubject conserva el valor actual. next publica un cambio a quienes lo observan.
  private readonly monthSubject = new BehaviorSubject(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  readonly months$ = this.monthSubject.pipe(
    map((month) => [this.buildMonth(month, 0), this.buildMonth(month, 1)]),
  );

  private buildMonth(month: Date, offset: number): CalendarMonth {
    const first = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    const days: CalendarDay[] = [];
    // Seis semanas completas mantienen estable la cuadrícula incluso en meses largos.
    const calendarCells = 6 * 7;
    for (let index = 0;index < calendarCells;index++) {
      const date = new Date(first.getFullYear(), first.getMonth(), index - first.getDay() + 1);
      const value = localDate(date);
      days.push({
        value,
        label: date.getDate(),
        disabled: date.getMonth() !== first.getMonth() || value < this.today,
      });
    }
    return {
      title: formatDate(first, 'LLLL y', this.locale),
      days,
    };
  }

  ngOnInit(): void {
    const value = this.stay;
    this.checkIn = value.checkIn;
    this.checkOut = value.checkOut;
    this.guests = Math.min(Math.max(Math.trunc(value.guests) || 1, 1), MAX_GUESTS);
  }
  changeMonth(delta: number): void {
    const current = this.monthSubject.value;
    this.monthSubject.next(
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }
  // Una salida a más de 90 noches de la llegada se toma como una nueva llegada.
  chooseDate(value: string): void {
    const startsAgain =
      !this.checkIn ||
      this.checkOut ||
      value <= this.checkIn ||
      stayNights(this.checkIn, value) > MAX_NIGHTS;
    if (!startsAgain) this.checkOut = value;
    else if (value <= this.lastCheckIn) {
      this.checkIn = value;
      this.checkOut = '';
    }
  }
  // Después de la última llegada posible solo se puede elegir la salida de la estancia ya empezada.
  isDisabled(day: { value: string; disabled: boolean }): boolean {
    if (day.disabled) return true;
    if (day.value <= this.lastCheckIn) return false;
    return (
      !this.checkIn ||
      !!this.checkOut ||
      day.value > addDays(this.checkIn, MAX_NIGHTS)
    );
  }
  get nights(): number {
    return this.checkIn && this.checkOut
      ? stayNights(this.checkIn, this.checkOut)
      : 0;
  }
  valid(): boolean {
    return validStay({
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      guests: this.guests,
    });
  }
  submit(): void {
    if (this.valid())
      this.continueBookingSubject.next({
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
      });
  }
}
