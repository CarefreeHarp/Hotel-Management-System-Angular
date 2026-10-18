package com.example.demo.service.interfaces;

import com.example.demo.dto.RoomDetailDTO;
import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import java.util.List;

/**
 * Contrato de negocio; los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO; las entidades solo se usan dentro del backend.
 */
public interface RoomService {
    List<RoomListDTO> listRooms();
    RoomDetailDTO findDetail(int roomId);
    Room findById(int roomId);
    Room findByNumber(int number);
    void create(Room room);
    void update(int roomId, Room room);
    void activate(int roomId);
    void deactivate(int roomId);
}
