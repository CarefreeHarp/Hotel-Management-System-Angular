import type { ActivationStatus } from '../enums/activation-status';
// Detalle y formulario de un servicio: todos sus atributos, como ServiceDetailDTO en el backend.
export interface ServiceDetailDTO {
  serviceId: number;
  name: string;
  urlName: string;
  description: string;
  price: number;
  category: string;
  activationStatus: ActivationStatus;
  summary?: string;
  duration?: string;
  availability?: string;
  location?: string;
  mainImageUrl: string;
  secondaryImageUrls: string[];
}
