package com.example.demo.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la tabla de servicios del panel: id, imagen, nombre, resumen,
 * categoría, precio y si está activo. El repositorio la crea en la consulta.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceListDTO {
    private Integer serviceId;
    private String name;
    private String summary;
    private String category;
    private BigDecimal price;
    private String mainImageUrl;
    // Indica en qué sección de la pantalla va el servicio: activos o inactivos.
    private Boolean active;
}
