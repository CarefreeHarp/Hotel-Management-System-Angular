package com.example.demo.dto;

import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.entities.enums.RoomStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Tablero del operario para la fecha del servidor. Las salidas pendientes son los
 * alojados cuya salida es hoy o ya pasó, por eso también aparecen en inHouse.
 */
public record FrontDeskBoard(LocalDate date, List<Stay> arrivals, List<Stay> inHouse,
        List<Stay> departures, List<RoomToPrepare> rooms) {
    // El saldo se calcula igual que en el detalle de la reserva: total menos pagado neto.
    public record Stay(Integer reservationId, String reservationCode, Integer clientId, String guestName,
            Integer guestCount, LocalDate checkInDate, LocalDate checkOutDate, ReservationStatus status,
            Integer roomNumber, String roomTypeName, RoomStatus roomStatus, BigDecimal balance) { }

    // arrivalExpected marca las habitaciones asignadas a una llegada que aún no hizo check-in.
    public record RoomToPrepare(Integer roomId, Integer number, Integer floor, String roomTypeName,
            RoomStatus status, boolean arrivalExpected) { }
}
