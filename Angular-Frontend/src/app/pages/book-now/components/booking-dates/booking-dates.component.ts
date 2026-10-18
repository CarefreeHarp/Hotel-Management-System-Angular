import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, map } from 'rxjs';
import { Component, Input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BookingStay, localDate, validStay } from '../../../../models/booking';
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
    this.guests = value.guests;
  }
  changeMonth(delta: number): void {
    const current = this.monthSubject.value;
    this.monthSubject.next(
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }
  chooseDate(value: string): void {
    if (!this.checkIn || this.checkOut || value <= this.checkIn) {
      this.checkIn = value;
      this.checkOut = '';
    } else this.checkOut = value;
  }
  get nights(): number {
    return this.checkIn && this.checkOut
      ? Math.round(
          (new Date(this.checkOut).getTime() -
            new Date(this.checkIn).getTime()) /
            86400000,
        )
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
