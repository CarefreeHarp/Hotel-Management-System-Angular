package com.example.demo.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la tabla de tipos de habitación (y tarjeta de la landing): id, nombre,
 * descripción, precio, capacidad y foto principal. Las fotos secundarias solo se
 * piden en el detalle. El repositorio la crea en la consulta (SELECT new ...).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeListDTO {
    private Integer roomTypeId;
    private String name;
    private String description;
    private BigDecimal nightlyPrice;
    private Integer maxCapacity;
    private String mainPhoto;
}
