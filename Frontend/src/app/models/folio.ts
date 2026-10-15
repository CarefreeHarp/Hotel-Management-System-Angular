import type { FolioStatus } from './enums/folio-status';
import type { Reservation } from './reservation';

export interface Folio {
  folioId: number;
  reservation: Reservation;
  status: FolioStatus;
  issuedAt: string;
}
