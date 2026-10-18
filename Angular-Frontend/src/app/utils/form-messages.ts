import { MAX_NIGHTS, MAX_YEARS_AHEAD } from '../models/booking';

/**
 * Mensaje de cada regla, por la clave del error de Angular (required,
 * maxlength, email…). Es el mismo texto que envía el backend para ese campo:
 * el usuario lee lo mismo si el error lo detecta Angular o Spring Boot.
 */
export type FieldMessages = Partial<Record<string, string>>;

const password: FieldMessages = {
  required: 'Enter a password.',
  minlength: 'The password must have between 8 and 255 characters.',
  maxlength: 'The password must have between 8 and 255 characters.',
};
const staffEmail: FieldMessages = {
  required: 'Enter the email address.',
  maxlength: 'The email address cannot exceed 100 characters.',
  email: 'Enter a valid email address, for example name@atlansuites.com.',
};
const photoUrl: FieldMessages = {
  maxlength: 'The photo URL cannot exceed 500 characters.',
  photoUrl: 'Enter a photo URL that starts with http:// or https://.',
};
const price: FieldMessages = {
  max: 'Enter a price of up to 99,999,999.99 with at most two decimals.',
  decimals: 'Enter a price of up to 99,999,999.99 with at most two decimals.',
};

export const LOGIN_MESSAGES = {
  email: {
    required: 'Enter your email address.',
    email: 'Enter a valid email address.',
    maxlength: 'The email address cannot exceed 100 characters.',
  },
  password: { required: 'Enter your password.' },
} satisfies Record<string, FieldMessages>;

export const CLIENT_MESSAGES = {
  name: {
    required: 'Enter the first name.',
    maxlength: 'The first name cannot exceed 60 characters.',
  },
  lastName: {
    required: 'Enter the last name.',
    maxlength: 'The last name cannot exceed 60 characters.',
  },
  nationalId: {
    required: 'Enter the national ID.',
    nationalId:
      'The national ID must have 5 to 20 letters or numbers, without spaces or symbols.',
  },
  phone: {
    required: 'Enter the phone number.',
    phone:
      'Enter a phone number with 7 to 15 digits, without spaces; it may start with +.',
  },
  email: {
    required: 'Enter the email address.',
    maxlength: 'The email address cannot exceed 100 characters.',
    email: 'Enter a valid email address, for example name@example.com.',
  },
  password,
  profilePhoto: photoUrl,
} satisfies Record<string, FieldMessages>;

export const ADMINISTRATOR_MESSAGES = {
  name: {
    required: "Enter the administrator's name.",
    maxlength: 'The name cannot exceed 60 characters.',
  },
  email: staffEmail,
  password,
} satisfies Record<string, FieldMessages>;

export const OPERATOR_MESSAGES = {
  name: {
    required: "Enter the operator's first name.",
    maxlength: 'The first name cannot exceed 60 characters.',
  },
  lastName: {
    required: "Enter the operator's last name.",
    maxlength: 'The last name cannot exceed 60 characters.',
  },
  email: staffEmail,
  password,
  adminId: { required: 'Select the administrator in charge of this operator.' },
} satisfies Record<string, FieldMessages>;

export const ROOM_TYPE_MESSAGES = {
  name: {
    required: 'Enter the room type name.',
    maxlength: 'The name cannot exceed 50 characters.',
  },
  description: {
    required: 'Enter a description.',
    maxlength: 'The description cannot exceed 500 characters.',
  },
  nightlyPrice: {
    required: 'Enter the price per night.',
    positive: 'The price per night must be greater than zero.',
    ...price,
  },
  maxCapacity: {
    required: 'Enter the maximum capacity.',
    min: 'The capacity must be at least 1 guest.',
    max: 'The capacity cannot exceed 10 guests.',
    integer: 'Enter a whole number of guests.',
  },
} satisfies Record<string, FieldMessages>;

export const PHOTO_MESSAGES = {
  main: { required: 'Enter the main photo URL.', ...photoUrl },
  additional: photoUrl,
} satisfies Record<string, FieldMessages>;

export const ROOM_MESSAGES = {
  number: {
    required: 'Enter the room number.',
    min: 'The room number must be at least 1.',
    max: 'The room number cannot exceed 9999.',
    integer: 'Enter a whole room number.',
  },
  floor: {
    required: 'Enter the floor.',
    min: 'The floor cannot be negative.',
    max: 'The floor cannot exceed 200.',
    integer: 'Enter a whole floor number.',
  },
  status: { required: 'Select the room status.' },
  roomTypeId: { required: 'Select a room type.' },
} satisfies Record<string, FieldMessages>;

export const SERVICE_MESSAGES = {
  name: {
    required: 'Enter the service name.',
    maxlength: 'The name cannot exceed 100 characters.',
  },
  category: {
    required: 'Enter the category.',
    maxlength: 'The category cannot exceed 50 characters.',
  },
  summary: { maxlength: 'The summary cannot exceed 255 characters.' },
  duration: { maxlength: 'The duration cannot exceed 50 characters.' },
  availability: { maxlength: 'The schedule cannot exceed 100 characters.' },
  location: { maxlength: 'The location cannot exceed 100 characters.' },
  description: {
    required: 'Enter a description.',
    maxlength: 'The description cannot exceed 5,000 characters.',
  },
  price: {
    required: 'Enter the price.',
    min: 'The price cannot be negative.',
    ...price,
  },
} satisfies Record<string, FieldMessages>;

export const RESERVATION_MESSAGES = {
  checkIn: {
    required: 'Choose a check-in date.',
    past: 'The check-in date cannot be in the past. Please choose new dates.',
    tooFar: `Reservations can be made at most ${MAX_YEARS_AHEAD} years in advance.`,
  },
  checkOut: {
    required: 'Choose a check-out date.',
    order: 'The check-out date must be after the check-in date.',
    tooLong: `A stay cannot exceed ${MAX_NIGHTS} nights.`,
  },
  guests: {
    required: 'Enter the number of guests.',
    min: 'Enter at least one guest.',
    integer: 'Enter a whole number of guests.',
  },
  roomTypeId: { min: 'Select a room type.' },
  status: { required: 'Choose a reservation status.' },
} satisfies Record<string, FieldMessages>;

// El pago de la reserva no es un formulario reactivo: sus reglas se revisan en BookingPaymentComponent.
export const PAYMENT_MESSAGES = {
  amount: {
    required: 'Enter the amount to pay.',
    decimals: 'The amount can have at most two decimals.',
    max: 'A single payment cannot exceed COP 99,999,999.99.',
  },
  cardholderName: {
    required: 'Enter the name on the card.',
    letters:
      'Enter the name as it appears on the card, using letters only (up to 100 characters).',
  },
  cardNumber: {
    required: 'Enter the card number.',
    length: 'The card number must have between 13 and 19 digits.',
  },
  expiryDate: {
    required: 'Enter the expiry date.',
    format: 'Enter the expiry date as MM/YY, with a month from 01 to 12.',
    expired: 'The card has expired.',
    tooFar: 'Enter a valid expiry date.',
  },
  securityCode: {
    required: 'Enter the security code.',
    length: 'The security code must have 3 or 4 digits.',
  },
} satisfies Record<string, FieldMessages>;
