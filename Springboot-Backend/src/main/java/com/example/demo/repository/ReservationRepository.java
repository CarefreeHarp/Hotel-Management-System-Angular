package com.example.demo.repository;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.enums.ReservationStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Consultas y proyecciones de lectura de Reservation. */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    // PESSIMISTIC_WRITE hace esperar otras escrituras sobre esta reserva hasta que termine la transacción.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT reservation
            FROM Reservation reservation
            WHERE reservation.reservationId = :id
            """)
    Optional<Reservation> lockForEditing(@Param("id") Integer id);

    /*
     * 1. Incorpora habitación, tipo y cliente con LEFT JOIN.
     * 2. Filtra por clientId y arma el DTO con los datos disponibles.
     * 3. Ordena por llegada, de la más reciente a la más antigua.
     */
    @Query("""
            SELECT new com.example.demo.dto.ReservationDTO(
                reservation.reservationId,
                reservation.reservationCode,
                reservation.checkInDate,
                reservation.checkOutDate,
                reservation.guestCount,
                reservation.status,
                room.number,
                roomType.roomTypeId,
                roomType.name,
                client.clientId,
                CONCAT(client.name, ' ', client.lastName),
                reservation.createdAt,
                roomType.mainPhoto
            )
            FROM Reservation reservation
            LEFT JOIN reservation.room room
            LEFT JOIN room.roomType roomType
            LEFT JOIN reservation.client client
            WHERE reservation.client.clientId = :clientId
            ORDER BY reservation.checkInDate DESC
            """)
    List<ReservationDTO> findAllForListByClientId(@Param("clientId") Integer clientId);

    /*
     * 1. LEFT JOIN conserva reservas aunque falten habitación o cliente.
     * 2. Arma los DTO y los ordena de la llegada más reciente a la más antigua.
     */
    @Query("""
            SELECT new com.example.demo.dto.ReservationDTO(
                reservation.reservationId,
                reservation.reservationCode,
                reservation.checkInDate,
                reservation.checkOutDate,
                reservation.guestCount,
                reservation.status,
                room.number,
                roomType.roomTypeId,
                roomType.name,
                client.clientId,
                CONCAT(client.name, ' ', client.lastName),
                reservation.createdAt,
                roomType.mainPhoto
            )
            FROM Reservation reservation
            LEFT JOIN reservation.room room
            LEFT JOIN room.roomType roomType
            LEFT JOIN reservation.client client
            ORDER BY reservation.checkInDate DESC
            """)
    List<ReservationDTO> findAllForList();

    /*
     * Llegadas del tablero del operario:
     * 1. Reservas pendientes o confirmadas cuya llegada es hoy o ya pasó.
     * 2. La salida sigue en el futuro: las atrasadas aparecen hasta que termina su estancia.
     * 3. Ordena primero las atrasadas y después por número de habitación.
     */
    @Query("""
            SELECT reservation
            FROM Reservation reservation
            LEFT JOIN reservation.room room
            WHERE reservation.status IN (com.example.demo.entities.enums.ReservationStatus.PENDING,
                                         com.example.demo.entities.enums.ReservationStatus.CONFIRMED)
              AND reservation.checkInDate <= :today
              AND reservation.checkOutDate > :today
            ORDER BY reservation.checkInDate, room.number
            """)
    List<Reservation> findArrivals(@Param("today") LocalDate today);

    /* Huéspedes alojados: primero las salidas más próximas y después por número de habitación. */
    @Query("""
            SELECT reservation
            FROM Reservation reservation
            LEFT JOIN reservation.room room
            WHERE reservation.status = com.example.demo.entities.enums.ReservationStatus.CHECKED_IN
            ORDER BY reservation.checkOutDate, room.number
            """)
    List<Reservation> findInHouse();

    @Modifying
    // Desvincula al cliente y conserva sus reservas.
    @Query("""
            UPDATE Reservation reservation
            SET reservation.client = null
            WHERE reservation.client.clientId = :clientId
            """)
    int clearClient(@Param("clientId") Integer clientId);

    /* Total de reservas de una habitación. */
    long countByRoom_RoomId(Integer roomId);

    /* Total de reservas que incluyen un servicio. */
    long countByServices_ServiceId(Integer serviceId);

    // La salida marca el final de la estancia: también protege reservas en curso.
    boolean existsByRoom_RoomIdAndStatusNotAndCheckOutDateAfter(
            Integer roomId, ReservationStatus status, LocalDate date);

    boolean existsByServices_ServiceIdAndStatusNotAndCheckOutDateAfter(
            Integer serviceId, ReservationStatus status, LocalDate date);

    // Indica si la habitación tiene un huésped alojado al terminar su limpieza o mantenimiento.
    boolean existsByRoom_RoomIdAndStatus(Integer roomId, ReservationStatus status);
}
