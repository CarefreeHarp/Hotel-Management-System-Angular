package com.example.demo.service;

import com.example.demo.dto.RoomDetailDTO;
import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import com.example.demo.repository.RoomRepository;
import com.example.demo.service.interfaces.ReservationService;
import com.example.demo.service.interfaces.RoomService;
import com.example.demo.entities.enums.RoomStatus;
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
    private com.example.demo.service.interfaces.RoomTypeService roomTypeService;

    @Autowired
    private ReservationService reservationService;

    @Override
    public List<RoomListDTO> listRooms() {
        // Activas e inactivas: la pantalla las separa en dos secciones con el atributo active.
        return roomRepository.findAllForList();
    }

    @Override
    public RoomDetailDTO findDetail(int roomId) {
        return RoomDetailDTO.from(findById(roomId));
    }

    @Override
    public Room findById(int roomId) {
        return roomRepository.findById(roomId)
                .get();
    }

    @Override
    public Room findByNumber(int number) {
        return roomRepository.findByNumber(number)
                .get();
    }

    @Override
    public void create(Room room) {
        // El id lo genera la base de datos. El formulario nunca debe conservarlo.
        room.setRoomId(null);
        room.setActive(true);
        checkNumberIsFree(room.getNumber(), null);
        resolveRoomType(room);
        roomRepository.save(room);
    }

    @Override
    public void update(int roomId, Room room) {
        Room registeredRoom = findById(roomId);

        checkNumberIsFree(room.getNumber(), registeredRoom.getRoomId());
        resolveRoomType(room);

        // Se conserva el id para actualizar la misma fila si cambia el número, y el
        // estado activo porque solo lo cambian los botones de activar y desactivar.
        room.setRoomId(registeredRoom.getRoomId());
        room.setActive(registeredRoom.getActive());
        roomRepository.save(room);
    }

    @Override
    public void delete(int roomId) {
        Room registeredRoom = findById(roomId);

        // El repositorio cuenta las reservas con una consulta. Una habitación con
        // reservas no se borra, para no perder el historial: se puede desactivar.
        long reservations = reservationService.countByRoom(registeredRoom.getRoomId());
        if (reservations > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room " + registeredRoom.getNumber() + " cannot be deleted because it has " + reservations
                            + " reservation(s). Deactivate it instead.");
        }

        if (registeredRoom.getStatus() == RoomStatus.OCCUPIED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room " + registeredRoom.getNumber() + " cannot be deleted because it is occupied.");
        }

        roomRepository.delete(registeredRoom);
    }

    @Override
    public void activate(int roomId) {
        Room registeredRoom = findById(roomId);
        registeredRoom.setActive(true);
        roomRepository.save(registeredRoom);
    }

    @Override
    public void deactivate(int roomId) {
        // La habitación se conserva con sus reservas; solo pasa a la sección de inactivas.
        Room registeredRoom = findById(roomId);
        registeredRoom.setActive(false);
        roomRepository.save(registeredRoom);
    }

    private void resolveRoomType(Room room) {
        room.setRoomType(roomTypeService.findById(room.getRoomType().getRoomTypeId()));
    }

    /** El número físico es único: si otra habitación ya lo usa se responde 409 y la pantalla muestra el motivo. */
    private void checkNumberIsFree(Integer number, Integer roomId) {
        roomRepository.findByNumber(number)
                .filter(other -> !other.getRoomId().equals(roomId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number " + number + " is already in use.");
                });
    }

}
