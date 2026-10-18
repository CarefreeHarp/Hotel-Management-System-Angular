package com.example.demo.repository;

import com.example.demo.entities.enums.ActivationStatus;

import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    @Query("""
        SELECT room FROM Room room JOIN FETCH room.roomType type
        WHERE room.activationStatus = com.example.demo.entities.enums.ActivationStatus.ACTIVE AND room.status <> com.example.demo.entities.enums.RoomStatus.MAINTENANCE
          AND type.maxCapacity >= :guests
          AND NOT EXISTS (SELECT reservation FROM Reservation reservation
            WHERE reservation.room = room
              AND (:excludedId IS NULL OR reservation.reservationId <> :excludedId)
              AND reservation.status <> com.example.demo.entities.enums.ReservationStatus.CANCELLED
              AND reservation.checkInDate < :checkOut AND reservation.checkOutDate > :checkIn)
        ORDER BY room.number
        """)
    List<Room> findAvailableForBooking(@org.springframework.data.repository.query.Param("checkIn") java.time.LocalDate checkIn,
        @org.springframework.data.repository.query.Param("checkOut") java.time.LocalDate checkOut,
        @org.springframework.data.repository.query.Param("guests") Integer guests,
        @org.springframework.data.repository.query.Param("excludedId") Integer excludedId);

    @Query("""
        SELECT MAX(type.maxCapacity) FROM Room room JOIN room.roomType type
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
     * Tabla de habitaciones: "SELECT new" arma cada RoomListDTO en la misma
     * consulta, así que solo se leen esas columnas y el tipo llega en el mismo JOIN.
     * Trae activas e inactivas: la pantalla las separa en dos secciones.
     */
    @Query("""
            SELECT new com.example.demo.dto.RoomListDTO(room.roomId, room.number, room.floor, room.status,
                    room.activationStatus, roomType.name, roomType.mainPhoto)
            FROM Room room JOIN room.roomType roomType
            ORDER BY room.number
            """)
    List<RoomListDTO> findAllForList();
}
