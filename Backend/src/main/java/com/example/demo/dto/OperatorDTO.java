package com.example.demo.dto;

import com.example.demo.entities.Operator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Datos visibles de un operario: los mismos en la tabla, el detalle y el
 * formulario. Del administrador a cargo solo se envían su id y su nombre.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OperatorDTO {
    private Integer operatorId;
    private String name;
    private String lastName;
    private String email;
    private Integer adminId;
    private String adminName;

    public static OperatorDTO from(Operator operator) {
        return new OperatorDTO(operator.getOperatorId(), operator.getName(), operator.getLastName(),
                operator.getEmail(), operator.getAdmin().getAdminId(), operator.getAdmin().getName());
    }
}
