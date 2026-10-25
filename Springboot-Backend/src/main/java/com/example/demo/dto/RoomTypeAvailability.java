package com.example.demo.dto;

/** Tipo ofrecido para una estancia y cantidad de habitaciones físicas que cumplen esa búsqueda. */
public record RoomTypeAvailability(RoomTypeListDTO roomType, int availableRooms) {
}
