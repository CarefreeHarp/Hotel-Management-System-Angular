// Fila de la tabla de servicios del panel: mismos atributos que ServiceListDTO en el backend.
export interface ServiceListDTO {
  serviceId: number;
  name: string;
  summary?: string;
  category: string;
  price: number;
  mainImageUrl: string;
  // Decide en qué sección se muestra: activos o inactivos.
  active: boolean;
}
