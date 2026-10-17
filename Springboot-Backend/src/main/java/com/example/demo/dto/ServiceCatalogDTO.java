package com.example.demo.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tarjeta del catálogo de servicios que ven los huéspedes. Solo se consultan
 * los servicios activos, así que no lleva el atributo active ni la galería.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCatalogDTO {
    private Integer serviceId;
    private String name;
    private String summary;
    private String description;
    private String category;
    private BigDecimal price;
    private String duration;
    private String availability;
    private String location;
    private String mainImageUrl;
}
