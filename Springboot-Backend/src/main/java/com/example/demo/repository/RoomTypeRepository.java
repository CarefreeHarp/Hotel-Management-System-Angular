package com.example.demo.repository;

import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * CAPA DE REPOSITORIO: acceso a la tabla ROOM_TYPE con Spring Data JPA.
 *
 * La llave primaria es room_type_id, de tipo Integer, y la genera la base de
 * datos con IDENTITY: por eso un tipo nuevo se guarda con el id en null.
 */
@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {

    // Serialize allocation within a room type, then re-read availability inside the transaction.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT type FROM RoomType type WHERE type.roomTypeId = :id")
    Optional<RoomType> lockForBooking(@org.springframework.data.repository.query.Param("id") Integer id);

    /* Busca un tipo de habitación por nombre sin distinguir mayúsculas de minúsculas. */
    Optional<RoomType> findByNameIgnoreCase(String name);

    /* Tabla de tipos y tarjetas de la landing: sin las fotos secundarias. */
    @Query("""
            SELECT new com.example.demo.dto.RoomTypeListDTO(roomType.roomTypeId, roomType.name,
                    roomType.description, roomType.nightlyPrice, roomType.maxCapacity, roomType.mainPhoto)
            FROM RoomType roomType
            ORDER BY roomType.roomTypeId
            """)
    List<RoomTypeListDTO> findAllForList();

    /* Selector del formulario de habitaciones: solo id y nombre. */
    @Query("""
            SELECT new com.example.demo.dto.RoomTypeOptionDTO(roomType.roomTypeId, roomType.name)
            FROM RoomType roomType
            ORDER BY roomType.name
            """)
    List<RoomTypeOptionDTO> findAllForOptions();
}
