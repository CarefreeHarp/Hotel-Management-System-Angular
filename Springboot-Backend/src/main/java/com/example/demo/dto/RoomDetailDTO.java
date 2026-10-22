package com.example.demo.dto;

import com.example.demo.entities.Room;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detalle y formulario de una habitación. El detalle también muestra la
 * descripción, el precio, la capacidad y la galería de su tipo, por eso lleva
 * el tipo completo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomDetailDTO {
    private Integer roomId;
    private Integer number;
    private Integer floor;
    private RoomStatus status;
    private ActivationStatus activationStatus;
    private RoomTypeDetailDTO roomType;

    public static RoomDetailDTO from(Room room) {
        return new RoomDetailDTO(room.getRoomId(), room.getNumber(), room.getFloor(), room.getStatus(),
                room.getActivationStatus(),
                RoomTypeDetailDTO.from(room.getRoomType()));
    }
}
