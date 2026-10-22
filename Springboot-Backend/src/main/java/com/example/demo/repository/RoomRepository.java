package com.example.demo.repository;

import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import com.example.demo.entities.enums.ActivationStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    /*
     * 1. Filtra habitaciones activas, sin mantenimiento y con capacidad suficiente.
     * 2. Descarta reservas no canceladas que crucen las fechas.
     *    excludedId omite la propia al editar. Si es null, revisa todas.
     *    Las estancias contiguas no se cruzan.
     * 3. Carga el tipo y devuelve las habitaciones ordenadas por número.
     */
    @Query("""
            SELECT room
            FROM Room room
            JOIN FETCH room.roomType type
            WHERE room.activationStatus = com.example.demo.entities.enums.ActivationStatus.ACTIVE
              AND room.status <> com.example.demo.entities.enums.RoomStatus.MAINTENANCE
              AND type.maxCapacity >= :guests
              AND NOT EXISTS (
                  SELECT reservation
                  FROM Reservation reservation
                  WHERE reservation.room = room
                    AND (:excludedId IS NULL OR reservation.reservationId <> :excludedId)
                    AND reservation.status <> com.example.demo.entities.enums.ReservationStatus.CANCELLED
                    AND reservation.checkInDate < :checkOut
                    AND reservation.checkOutDate > :checkIn
              )
            ORDER BY room.number
            """)
    List<Room> findAvailableForBooking(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("guests") Integer guests,
            @Param("excludedId") Integer excludedId);

    /*
     * 1. Considera habitaciones activas y fuera de mantenimiento.
     * 2. Devuelve su mayor capacidad, o null si no queda ninguna.
     */
    @Query("""
            SELECT MAX(type.maxCapacity)
            FROM Room room
            JOIN room.roomType type
            WHERE room.activationStatus = com.example.demo.entities.enums.ActivationStatus.ACTIVE
              AND room.status <> com.example.demo.entities.enums.RoomStatus.MAINTENANCE
            """)
    Integer findMaximumBookableCapacity();

    /* Total de habitaciones de un tipo: un tipo con habitaciones no se borra. */
    long countByRoomType_RoomTypeId(Integer roomTypeId);

    /* Busca una habitación por su número físico. */
    Optional<Room> findByNumber(Integer number);

    /* Total de habitaciones en uso para el panel. */
    long countByActivationStatus(ActivationStatus activationStatus);

    /*
     * 1. Une habitaciones activas e inactivas con su tipo.
     * 2. Arma los DTO y los ordena por número de habitación.
     */
    @Query("""
            SELECT new com.example.demo.dto.RoomListDTO(
                room.roomId,
                room.number,
                room.floor,
                room.status,
                room.activationStatus,
                roomType.name,
                roomType.mainPhoto
            )
            FROM Room room
            JOIN room.roomType roomType
            ORDER BY room.number
            """)
    List<RoomListDTO> findAllForList();
}
