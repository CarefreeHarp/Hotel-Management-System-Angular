/**
 * Clave de traducción del mensaje de cada regla, por la clave del error de Angular
 * (required, maxlength, email…). En inglés es el mismo texto que envía el backend
 * para ese campo. FormFieldComponent traduce la clave; los mensajes que llegan del
 * servidor se muestran tal cual.
 */
export type FieldMessages = Partial<Record<string, string>>;

const password: FieldMessages = {
  required: 'validation.password.required',
  minlength: 'validation.password.length',
  maxlength: 'validation.password.length',
};
const staffEmail: FieldMessages = {
  required: 'validation.staffEmail.required',
  maxlength: 'validation.staffEmail.maxlength',
  email: 'validation.staffEmail.email',
};
const photoUrl: FieldMessages = {
  maxlength: 'validation.photoUrl.maxlength',
  photoUrl: 'validation.photoUrl.format',
};
const price: FieldMessages = {
  max: 'validation.price.format',
  decimals: 'validation.price.format',
};

export const LOGIN_MESSAGES = {
  email: {
    required: 'validation.login.email.required',
    email: 'validation.login.email.email',
    maxlength: 'validation.login.email.maxlength',
  },
  password: { required: 'validation.login.password.required' },
} satisfies Record<string, FieldMessages>;

export const CLIENT_MESSAGES = {
  name: {
    required: 'validation.client.name.required',
    maxlength: 'validation.client.name.maxlength',
  },
  lastName: {
    required: 'validation.client.lastName.required',
    maxlength: 'validation.client.lastName.maxlength',
  },
  nationalId: {
    required: 'validation.client.nationalId.required',
    nationalId: 'validation.client.nationalId.format',
  },
  phone: {
    required: 'validation.client.phone.required',
    phone: 'validation.client.phone.format',
  },
  email: {
    required: 'validation.client.email.required',
    maxlength: 'validation.client.email.maxlength',
    email: 'validation.client.email.email',
  },
  password,
  profilePhoto: photoUrl,
} satisfies Record<string, FieldMessages>;

export const ADMINISTRATOR_MESSAGES = {
  name: {
    required: 'validation.administrator.name.required',
    maxlength: 'validation.administrator.name.maxlength',
  },
  email: staffEmail,
  password,
} satisfies Record<string, FieldMessages>;

export const OPERATOR_MESSAGES = {
  name: {
    required: 'validation.operator.name.required',
    maxlength: 'validation.operator.name.maxlength',
  },
  lastName: {
    required: 'validation.operator.lastName.required',
    maxlength: 'validation.operator.lastName.maxlength',
  },
  email: staffEmail,
  password,
  adminId: { required: 'validation.operator.adminId.required' },
} satisfies Record<string, FieldMessages>;

export const ROOM_TYPE_MESSAGES = {
  name: {
    required: 'validation.roomType.name.required',
    maxlength: 'validation.roomType.name.maxlength',
  },
  description: {
    required: 'validation.roomType.description.required',
    maxlength: 'validation.roomType.description.maxlength',
  },
  nightlyPrice: {
    required: 'validation.roomType.nightlyPrice.required',
    positive: 'validation.roomType.nightlyPrice.positive',
    ...price,
  },
  maxCapacity: {
    required: 'validation.roomType.maxCapacity.required',
    min: 'validation.roomType.maxCapacity.min',
    max: 'validation.roomType.maxCapacity.max',
    integer: 'validation.roomType.maxCapacity.integer',
  },
} satisfies Record<string, FieldMessages>;

export const PHOTO_MESSAGES = {
  main: { required: 'validation.photo.mainRequired', ...photoUrl },
  additional: photoUrl,
} satisfies Record<string, FieldMessages>;

export const ROOM_MESSAGES = {
  number: {
    required: 'validation.room.number.required',
    min: 'validation.room.number.min',
    max: 'validation.room.number.max',
    integer: 'validation.room.number.integer',
  },
  floor: {
    required: 'validation.room.floor.required',
    min: 'validation.room.floor.min',
    max: 'validation.room.floor.max',
    integer: 'validation.room.floor.integer',
  },
  status: { required: 'validation.room.status.required' },
  roomTypeId: { required: 'validation.room.roomTypeId.required' },
} satisfies Record<string, FieldMessages>;

export const SERVICE_MESSAGES = {
  name: {
    required: 'validation.service.name.required',
    maxlength: 'validation.service.name.maxlength',
  },
  category: {
    required: 'validation.service.category.required',
    maxlength: 'validation.service.category.maxlength',
  },
  summary: { maxlength: 'validation.service.summary.maxlength' },
  duration: { maxlength: 'validation.service.duration.maxlength' },
  availability: { maxlength: 'validation.service.availability.maxlength' },
  location: { maxlength: 'validation.service.location.maxlength' },
  description: {
    required: 'validation.service.description.required',
    maxlength: 'validation.service.description.maxlength',
  },
  price: {
    required: 'validation.service.price.required',
    min: 'validation.service.price.min',
    ...price,
  },
} satisfies Record<string, FieldMessages>;

// tooFar, tooLong y capacity llevan los parámetros years, nights y capacity (messageParams de FormFieldComponent).
export const RESERVATION_MESSAGES = {
  checkIn: {
    required: 'validation.reservation.checkIn.required',
    past: 'validation.reservation.checkIn.past',
    tooFar: 'validation.reservation.checkIn.tooFar',
  },
  checkOut: {
    required: 'validation.reservation.checkOut.required',
    order: 'validation.reservation.checkOut.order',
    tooLong: 'validation.reservation.checkOut.tooLong',
  },
  guests: {
    required: 'validation.reservation.guests.required',
    min: 'validation.reservation.guests.min',
    integer: 'validation.reservation.guests.integer',
    capacity: 'validation.reservation.guests.capacity',
  },
  roomTypeId: { min: 'validation.reservation.roomTypeId.min' },
  status: {
    required: 'validation.reservation.status.required',
    pending: 'validation.reservation.status.pending',
    unpaid: 'validation.reservation.status.unpaid',
  },
} satisfies Record<string, FieldMessages>;

// El pago de la reserva no es un formulario reactivo: sus reglas se revisan en BookingPaymentComponent.
export const PAYMENT_MESSAGES = {
  amount: {
    required: 'validation.payment.amount.required',
    decimals: 'validation.payment.amount.decimals',
    max: 'validation.payment.amount.max',
  },
  cardholderName: {
    required: 'validation.payment.cardholderName.required',
    letters: 'validation.payment.cardholderName.letters',
  },
  cardNumber: {
    required: 'validation.payment.cardNumber.required',
    length: 'validation.payment.cardNumber.length',
  },
  expiryDate: {
    required: 'validation.payment.expiryDate.required',
    format: 'validation.payment.expiryDate.format',
    expired: 'validation.payment.expiryDate.expired',
    tooFar: 'validation.payment.expiryDate.tooFar',
  },
  securityCode: {
    required: 'validation.payment.securityCode.required',
    length: 'validation.payment.securityCode.length',
  },
} satisfies Record<string, FieldMessages>;
