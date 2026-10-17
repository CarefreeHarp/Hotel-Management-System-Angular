package com.example.demo.service.interfaces;

import com.example.demo.dto.RoomTypeDetailDTO;
import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import java.util.List;

/**
 * Contrato de negocio; los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO; las entidades solo se usan dentro del backend.
 */
public interface RoomTypeService {
    List<RoomTypeListDTO> listTypes();
    List<RoomTypeOptionDTO> listOptions();
    RoomTypeDetailDTO findDetail(int roomTypeId);
    RoomType findById(int roomTypeId);
    RoomType findByName(String name);
    void create(RoomType roomType);
    void update(int roomTypeId, RoomType roomType);
    void delete(int roomTypeId);
}
