import type { ActivationStatus } from '../enums/activation-status';
// Fila de la tabla de servicios del panel: mismos atributos que ServiceListDTO en el backend.
export interface ServiceListDTO {
  serviceId: number;
  name: string;
  summary?: string;
  category: string;
  price: number;
  mainImageUrl: string;
  activationStatus: ActivationStatus;
}
