package com.example.demo.entities.enums;

public enum RoomStatus {
    AVAILABLE,
    OCCUPIED,
    // El check-out del tablero deja la habitación en limpieza. Se puede seguir reservando.
    CLEANING,
    MAINTENANCE
}
