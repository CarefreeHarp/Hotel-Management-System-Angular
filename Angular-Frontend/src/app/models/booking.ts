import { ReservationDTO } from './dto/reservation-dto';
import { RoomTypeListDTO } from './dto/room-type-list-dto';
import { ServiceCatalogDTO } from './dto/service-catalog-dto';
export type BookingStep =
  | 'dates'
  | 'room-types'
  | 'services'
  | 'checkout'
  | 'payment';
// El conteo corresponde a fechas y huéspedes concretos. No es el inventario total del tipo.
export interface RoomTypeAvailability {
  roomType: RoomTypeListDTO;
  availableRooms: number;
}
export interface BookingStay {
  checkIn: string;
  checkOut: string;
  guests: number;
}
// El borrador se puede reconstruir desde la URL. Los datos de tarjeta viajan por separado.
export interface BookingDraft extends BookingStay {
  roomTypeId: number;
  serviceIds: number[];
}
export interface CardPayment {
  amount: number;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  securityCode: string;
}
export interface BookingQuote {
  roomType: RoomTypeListDTO;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  nights: number;
  stayTotal: number;
  services: ServiceCatalogDTO[];
  servicesTotal: number;
  subtotal: number;
  total: number;
}
export interface ReservationCharge {
  itemId?: number;
  serviceId?: number;
  concept: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  chargedAt?: string;
}
export interface ReservationPayment {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: string;
  operatorName: string;
}
export interface ReservationRefund {
  refundId: number;
  amount: number;
  refundMethod: string;
  reason: string;
  status: string;
  notes: string;
  refundedAt: string;
  operatorName: string;
}
export interface ReservationDetails {
  reservation: ReservationDTO;
  clientId?: number;
  roomFloor?: number;
  roomTypeMainPhoto?: string;
  maxCapacity?: number;
  createdAt: string;
  nightlyPrice: number;
  nights: number;
  folioId?: number;
  folioStatus?: string;
  issuedAt?: string;
  subtotal: number;
  total: number;
  // Pagado neto: pagos aprobados menos reembolsos aprobados.
  paidTotal: number;
  refundedTotal: number;
  balance: number;
  charges: ReservationCharge[];
  payments: ReservationPayment[];
  refunds: ReservationRefund[];
}
// Límites de una reserva y del pago simulado: los mismos que BookingService en el backend.
export const MAX_NIGHTS = 90;
export const MAX_YEARS_AHEAD = 2;
// Ningún tipo de habitación admite más de 10 huéspedes (RoomType.maxCapacity).
export const MAX_GUESTS = 10;
export const MIN_PAYMENT = 100000;
export const MAX_PAYMENT = 99999999.99;
// Las mismas reglas se comprueban en el servidor antes de modificar o cobrar.
export function canModifyReservation(detail: ReservationDetails): boolean {
  const reservation = detail.reservation;
  return (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') &&
    reservation.checkInDate >= localDate() && reservation.roomTypeId !== undefined;
}
export function canPayReservation(detail: ReservationDetails): boolean {
  const reservation = detail.reservation;
  return detail.balance > 0 && reservation.status !== 'CANCELLED' &&
    reservation.status !== 'CHECKED_OUT' && reservation.checkOutDate > localDate();
}
// El calendario usa la fecha local. Convertirla a UTC podría desplazar el día.
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
// Última llegada que se puede reservar: hoy más dos años.
export function latestCheckIn(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + MAX_YEARS_AHEAD);
  return localDate(date);
}
// Las fechas ISO sin hora se comparan como días completos, independientemente del horario local.
export function stayNights(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
}
export function validStay(stay: BookingStay): boolean {
  const validDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && localDate(date) === value;
  };
  return (
    validDate(stay.checkIn) &&
    validDate(stay.checkOut) &&
    stay.checkIn >= localDate() &&
    stay.checkIn <= latestCheckIn() &&
    stay.checkOut > stay.checkIn &&
    stayNights(stay.checkIn, stay.checkOut) <= MAX_NIGHTS &&
    Number.isSafeInteger(stay.guests) &&
    stay.guests > 0 &&
    stay.guests <= MAX_GUESTS
  );
}
