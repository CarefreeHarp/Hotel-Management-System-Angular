// Detalle, formulario y perfil de un cliente: todo menos la contraseña, como ClientDetailDTO en el backend.
export interface ClientDetailDTO {
  clientId: number;
  name: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  profilePhoto?: string;
}
