package com.example.demo.dto;

import com.example.demo.entities.Administrator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Datos visibles de un administrador: id, nombre y correo. Lo usan el detalle,
 * el formulario, la sesión del panel y el selector del formulario de operarios.
 * La contraseña nunca se envía al navegador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministratorDTO {
    private Integer adminId;
    private String name;
    private String email;

    public static AdministratorDTO from(Administrator administrator) {
        return new AdministratorDTO(administrator.getAdminId(), administrator.getName(), administrator.getEmail());
    }
}
