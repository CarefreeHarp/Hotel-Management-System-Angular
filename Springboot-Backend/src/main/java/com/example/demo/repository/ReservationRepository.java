package com.example.demo.repository;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.entities.Reservation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * CAPA DE REPOSITORIO: acceso a la tabla RESERVATION con Spring Data JPA.
 *
 * Las consultas de @Query arman las reservas del perfil como DTO, y las
 * derivadas cuentan las reservas de una habitación o un servicio con un
 * SELECT COUNT: la capa de servicio lee ese total antes de borrar.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT reservation FROM Reservation reservation WHERE reservation.reservationId = :id")
    java.util.Optional<Reservation> lockForEditing(@Param("id") Integer id);

    /*
     * Reservas de un cliente para su perfil, de la llegada más reciente a la más
     * antigua. LEFT JOIN porque la reserva podría no tener habitación asignada.
     */
    @Query("""
            SELECT new com.example.demo.dto.ReservationDTO(reservation.reservationId, reservation.reservationCode,
                    reservation.checkInDate, reservation.checkOutDate, reservation.guestCount, reservation.status,
                    room.number, roomType.roomTypeId, roomType.name, client.clientId,
                    CONCAT(client.name, ' ', client.lastName), reservation.createdAt, roomType.mainPhoto)
            FROM Reservation reservation LEFT JOIN reservation.room room LEFT JOIN room.roomType roomType LEFT JOIN reservation.client client
            WHERE reservation.client.clientId = :clientId
            ORDER BY reservation.checkInDate DESC
            """)
    List<ReservationDTO> findAllForListByClientId(@Param("clientId") Integer clientId);

    /* Todas las reservas, con los mismos datos que el perfil. */
    @Query("""
            SELECT new com.example.demo.dto.ReservationDTO(reservation.reservationId, reservation.reservationCode,
                    reservation.checkInDate, reservation.checkOutDate, reservation.guestCount, reservation.status,
                    room.number, roomType.roomTypeId, roomType.name, client.clientId,
                    CONCAT(client.name, ' ', client.lastName), reservation.createdAt, roomType.mainPhoto)
            FROM Reservation reservation LEFT JOIN reservation.room room LEFT JOIN room.roomType roomType LEFT JOIN reservation.client client
            ORDER BY reservation.checkInDate DESC
            """)
    List<ReservationDTO> findAllForList();

    /*
     * Antes de borrar un cliente se deja su client_id en null: las reservas siguen
     * en el historial, sin cliente. Es un UPDATE, por eso lleva @Modifying.
     */
    @Modifying
    @Query("UPDATE Reservation reservation SET reservation.client = null WHERE reservation.client.clientId = :clientId")
    int clearClient(@Param("clientId") Integer clientId);

    /* Total de reservas de una habitación. */
    long countByRoom_RoomId(Integer roomId);

    /* Total de reservas que incluyen un servicio. */
    long countByServices_ServiceId(Integer serviceId);
}
