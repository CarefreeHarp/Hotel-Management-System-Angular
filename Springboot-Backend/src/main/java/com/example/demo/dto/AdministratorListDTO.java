package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la tabla de administradores: id, nombre, correo y cuántos operarios
 * tiene a cargo. La consulta cuenta los operarios (COUNT), así que no hace falta
 * descargar la lista de operarios para mostrar ese número.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministratorListDTO {
    private Integer adminId;
    private String name;
    private String email;
    private Long operatorCount;
}
