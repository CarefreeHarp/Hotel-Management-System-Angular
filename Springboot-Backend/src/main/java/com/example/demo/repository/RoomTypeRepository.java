package com.example.demo.repository;

import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * CAPA DE REPOSITORIO: acceso a la tabla ROOM_TYPE con Spring Data JPA.
 *
 * La llave primaria es room_type_id, de tipo Integer, y la genera la base de
 * datos con IDENTITY: por eso un tipo nuevo se guarda con el id en null.
 */
@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {

    // PESSIMISTIC_WRITE permite una asignación por tipo a la vez. La disponibilidad se consulta después.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT type
            FROM RoomType type
            WHERE type.roomTypeId = :id
            """)
    Optional<RoomType> lockForBooking(@Param("id") Integer id);

    /* Busca un tipo de habitación por nombre sin distinguir mayúsculas de minúsculas. */
    Optional<RoomType> findByNameIgnoreCase(String name);

    // Tipos para la lista, sin la galería de fotos.
    @Query("""
            SELECT new com.example.demo.dto.RoomTypeListDTO(
                roomType.roomTypeId,
                roomType.name,
                roomType.description,
                roomType.nightlyPrice,
                roomType.maxCapacity,
                roomType.mainPhoto
            )
            FROM RoomType roomType
            ORDER BY roomType.roomTypeId
            """)
    List<RoomTypeListDTO> findAllForList();

    // Id y nombre para elegir un tipo de habitación.
    @Query("""
            SELECT new com.example.demo.dto.RoomTypeOptionDTO(roomType.roomTypeId, roomType.name)
            FROM RoomType roomType
            ORDER BY roomType.name
            """)
    List<RoomTypeOptionDTO> findAllForOptions();
}
