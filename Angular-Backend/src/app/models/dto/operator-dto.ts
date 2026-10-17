// Datos visibles de un operario (tabla, detalle y formulario): como OperatorDTO en el backend.
export interface OperatorDTO {
  operatorId: number;
  name: string;
  lastName: string;
  email: string;
  adminId: number;
  adminName: string;
}
