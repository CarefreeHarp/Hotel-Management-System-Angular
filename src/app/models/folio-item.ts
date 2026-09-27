import type { Folio } from './folio';
import type { Service } from './service';

export interface FolioItem {
  itemId: number;
  folio: Folio;
  service?: Service;
  concept: string;
  unitPrice: number;
  quantity: number;
  chargedAt: string;
}
