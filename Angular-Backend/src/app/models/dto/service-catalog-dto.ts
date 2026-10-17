// Tarjeta del catálogo de los huéspedes (solo servicios activos): como ServiceCatalogDTO en el backend.
export interface ServiceCatalogDTO {
  serviceId: number;
  name: string;
  summary?: string;
  description: string;
  category: string;
  price: number;
  duration?: string;
  availability?: string;
  location?: string;
  mainImageUrl: string;
}
