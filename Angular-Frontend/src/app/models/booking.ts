import { RoomTypeListDTO } from './dto/room-type-list-dto';
import { ServiceCatalogDTO } from './dto/service-catalog-dto';
import { ReservationDTO } from './dto/reservation-dto';
export type BookingStep =
  | 'dates'
  | 'room-types'
  | 'services'
  | 'checkout'
  | 'payment';
export interface BookingStay {
  checkIn: string;
  checkOut: string;
  guests: number;
}
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
  paidTotal: number;
  balance: number;
  charges: ReservationCharge[];
  payments: ReservationPayment[];
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    stay.checkOut > stay.checkIn &&
    Number.isSafeInteger(stay.guests) &&
    stay.guests > 0
  );
}
