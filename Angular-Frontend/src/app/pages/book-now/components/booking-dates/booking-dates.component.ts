import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, map } from 'rxjs';
import { Component, Input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  BookingStay,
  MAX_GUESTS,
  MAX_NIGHTS,
  addDays,
  latestCheckIn,
  localDate,
  stayNights,
  validStay,
} from '../../../../models/booking';
@Component({
  selector: 'app-booking-dates',
  imports: [AsyncPipe, FormsModule, DatePipe],
  templateUrl: './booking-dates.component.html',
  styleUrl: './booking-dates.component.scss',
})
export class BookingDatesComponent {
  @Input({ required: true }) stay: BookingStay = {
    checkIn: '',
    checkOut: '',
    guests: 1,
  };
  readonly continueBooking = output<BookingStay>();
  checkIn = '';
  checkOut = '';
  guests = 1;
  readonly today = localDate();
  // Mismos límites que el backend: llegada hasta dos años, estancia de hasta 90 noches.
  readonly lastCheckIn = latestCheckIn();
  readonly maxNights = MAX_NIGHTS;
  readonly maxGuests = MAX_GUESTS;
  private readonly monthSubject = new BehaviorSubject(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  readonly months$ = this.monthSubject.pipe(
    map((month) =>
      [0, 1].map((offset) => {
        const first = new Date(
          month.getFullYear(),
          month.getMonth() + offset,
          1,
        );
        return {
          title: first.toLocaleDateString('en', {
            month: 'long',
            year: 'numeric',
          }),
          days: Array.from({ length: 42 }, (_, index) => {
            const date = new Date(
              first.getFullYear(),
              first.getMonth(),
              index - first.getDay() + 1,
            );
            return {
              value: localDate(date),
              label: date.getDate(),
              disabled:
                date.getMonth() !== first.getMonth() ||
                localDate(date) < this.today,
            };
          }),
        };
      }),
    ),
  );
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
      this.continueBooking.emit({
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
      });
  }
}
