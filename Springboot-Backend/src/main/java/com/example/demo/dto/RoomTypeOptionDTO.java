package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Opción del selector de tipo en el formulario de habitaciones: solo id y nombre. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomTypeOptionDTO {
    private Integer roomTypeId;
    private String name;
}
