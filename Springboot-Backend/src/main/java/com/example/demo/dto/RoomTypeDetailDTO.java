package com.example.demo.dto;

import com.example.demo.entities.RoomType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detalle y formulario de un tipo de habitación: muestran todos sus atributos,
 * así que el DTO tiene los mismos que la entidad, sin la lista de habitaciones.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeDetailDTO {
    private Integer roomTypeId;
    private String name;
    private String description;
    private BigDecimal nightlyPrice;
    private Integer maxCapacity;
    private String mainPhoto;
    private List<String> secondaryPhotos;

    /** El servicio copia en el DTO los datos de la entidad que se va a mostrar. */
    public static RoomTypeDetailDTO from(RoomType roomType) {
        return new RoomTypeDetailDTO(roomType.getRoomTypeId(), roomType.getName(), roomType.getDescription(),
                roomType.getNightlyPrice(), roomType.getMaxCapacity(), roomType.getMainPhoto(),
                new ArrayList<>(roomType.getSecondaryPhotos()));
    }
}
