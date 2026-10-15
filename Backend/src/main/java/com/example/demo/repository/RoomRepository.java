package com.example.demo.repository;

import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    /* Total de habitaciones de un tipo: un tipo con habitaciones no se borra. */
    long countByRoomType_RoomTypeId(Integer roomTypeId);

    /* Busca una habitación por su número físico. */
    Optional<Room> findByNumber(Integer number);

    /* Total de habitaciones en uso para el panel. */
    long countByActiveTrue();

    /*
     * Tabla de habitaciones: "SELECT new" arma cada RoomListDTO en la misma
     * consulta, así que solo se leen esas columnas y el tipo llega en el mismo JOIN.
     * Trae activas e inactivas: la pantalla las separa en dos secciones.
     */
    @Query("""
            SELECT new com.example.demo.dto.RoomListDTO(room.roomId, room.number, room.floor, room.status,
                    room.active, roomType.name, roomType.mainPhoto)
            FROM Room room JOIN room.roomType roomType
            ORDER BY room.number
            """)
    List<RoomListDTO> findAllForList();
}
