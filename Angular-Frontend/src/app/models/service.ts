import type { ActivationStatus } from './enums/activation-status';
export interface Service {
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
