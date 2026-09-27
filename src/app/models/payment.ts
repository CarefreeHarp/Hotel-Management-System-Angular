import type { PaymentStatus } from './enums/payment-status';
import type { Folio } from './folio';
import type { Operator } from './operator';

export interface Payment {
  paymentId: number;
  folio: Folio;
  operator?: Operator;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  paidAt: string;
}
