package com.example.demo.dto;

import com.example.demo.entities.Reservation;
import com.example.demo.entities.enums.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reserva tal como la muestra el perfil del cliente: código, fechas, huéspedes,
 * estado, número de habitación y nombre de su tipo (con su id para el enlace).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDTO {
    private Integer reservationId;
    private String reservationCode;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guestCount;
    private ReservationStatus status;
    private Integer roomNumber;
    private Integer roomTypeId;
    private String roomTypeName;
    private Integer clientId;
    private String clientName;
    private LocalDateTime createdAt;
    private String roomTypeMainPhoto;

    public static ReservationDTO from(Reservation reservation) {
        boolean hasRoom = reservation.getRoom() != null;
        return new ReservationDTO(reservation.getReservationId(), reservation.getReservationCode(),
                reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getGuestCount(),
                reservation.getStatus(),
                hasRoom ? reservation.getRoom().getNumber() : null,
                hasRoom ? reservation.getRoom().getRoomType().getRoomTypeId() : null,
                hasRoom ? reservation.getRoom().getRoomType().getName() : null,
                reservation.getClient() == null ? null : reservation.getClient().getClientId(),
                reservation.getClient() == null ? null
                        : reservation.getClient().getName() + " " + reservation.getClient().getLastName(),
                reservation.getCreatedAt(),
                hasRoom ? reservation.getRoom().getRoomType().getMainPhoto() : null);
    }
}
