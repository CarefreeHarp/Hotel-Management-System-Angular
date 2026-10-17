package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la tabla de clientes del panel: id, nombre, documento, correo y
 * teléfono. Ni la foto ni la contraseña salen del backend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientListDTO {
    private Integer clientId;
    private String name;
    private String lastName;
    private String nationalId;
    private String email;
    private String phone;
}
