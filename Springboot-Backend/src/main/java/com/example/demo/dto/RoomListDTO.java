package com.example.demo.dto;

import com.example.demo.entities.enums.ActivationStatus;

import com.example.demo.entities.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fila de la tabla de habitaciones del panel: id, número, piso, estado, nombre y
 * foto del tipo. El repositorio la crea en la propia consulta (SELECT new ...),
 * así que el orden de los atributos es el orden del constructor.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomListDTO {
    private Integer roomId;
    private Integer number;
    private Integer floor;
    private RoomStatus status;
    // Disponibilidad independiente del estado físico.
    private ActivationStatus activationStatus;
    private String roomTypeName;
    private String mainPhoto;
}
