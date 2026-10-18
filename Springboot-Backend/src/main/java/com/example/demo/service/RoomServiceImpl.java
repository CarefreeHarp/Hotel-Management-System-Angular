package com.example.demo.service;

import com.example.demo.entities.enums.ActivationStatus;

import com.example.demo.dto.RoomDetailDTO;
import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.RoomService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Operaciones CRUD de habitaciones; roomId se conserva aunque cambie el número físico. */
@Service
@org.springframework.transaction.annotation.Transactional
public class RoomServiceImpl implements RoomService {

    @Autowired
    RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;


    @Override
    public List<RoomListDTO> listRooms() {
        // Incluye ambos estados de activación para los filtros de gestión.
        return roomRepository.findAllForList();
    }

    @Override
    public RoomDetailDTO findDetail(int roomId) {
        return RoomDetailDTO.from(findById(roomId));
    }

    @Override
    public Room findById(int roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found."));
    }

    @Override
    public Room findByNumber(int number) {
        return roomRepository.findByNumber(number)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found."));
    }

    @Override
    public void create(Room room) {
        // El id lo genera la base de datos. El formulario nunca debe conservarlo.
        room.setRoomId(null);
        checkNumberIsFree(room.getNumber(), null);
        resolveRoomType(room);
        roomRepository.save(room);
    }

    @Override
    public void update(int roomId, Room room) {
        Room registeredRoom = findById(roomId);

        checkNumberIsFree(room.getNumber(), registeredRoom.getRoomId());
        resolveRoomType(room);

        // Se conserva el id al cambiar el número físico.
        room.setRoomId(registeredRoom.getRoomId());
        roomRepository.save(room);
    }

    @Override
    public void activate(int roomId) {
        Room registeredRoom = findById(roomId);
        registeredRoom.setActivationStatus(ActivationStatus.ACTIVE);
        roomRepository.save(registeredRoom);
    }

    @Override
    public void deactivate(int roomId) {
        // Conserva el estado físico y las reservas existentes.
        Room registeredRoom = findById(roomId);
        registeredRoom.setActivationStatus(ActivationStatus.INACTIVE);
        roomRepository.save(registeredRoom);
    }

    /** El tipo es un campo del formulario: si falta o ya no existe, el error va en ese campo. */
    private void resolveRoomType(Room room) {
        Integer roomTypeId = room.getRoomType() == null ? null : room.getRoomType().getRoomTypeId();
        if (roomTypeId == null) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "roomType", "Select a room type.");
        }
        room.setRoomType(roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new FieldException(HttpStatus.BAD_REQUEST, "roomType", "The selected room type no longer exists.")));
    }

    /** El número físico es único: si otra habitación ya lo usa se responde 409 y la pantalla muestra el motivo. */
    private void checkNumberIsFree(Integer number, Integer roomId) {
        roomRepository.findByNumber(number)
                .filter(other -> !other.getRoomId().equals(roomId))
                .ifPresent(other -> {
                    throw new FieldException(HttpStatus.CONFLICT, "number", "Room number " + number + " is already in use.");
                });
    }

}
