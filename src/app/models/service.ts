export interface Service {
  serviceId: number;
  name: string;
  urlName: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  summary?: string;
  duration?: string;
  availability?: string;
  location?: string;
  mainImageUrl: string;
  secondaryImageUrls: string[];
}
