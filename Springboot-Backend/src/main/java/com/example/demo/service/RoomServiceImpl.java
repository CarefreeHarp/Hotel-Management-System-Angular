package com.example.demo.service;

import com.example.demo.dto.RoomDetailDTO;
import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.RoomService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD de habitaciones. roomId se conserva aunque cambie el número físico. */
@Service
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    private final RoomTypeRepository roomTypeRepository;

    private final ReservationRepository reservationRepository;

    public RoomServiceImpl(RoomRepository roomRepository, RoomTypeRepository roomTypeRepository,
            ReservationRepository reservationRepository) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.reservationRepository = reservationRepository;
    }

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

        if (room.getActivationStatus() == ActivationStatus.INACTIVE
                && registeredRoom.getActivationStatus() == ActivationStatus.ACTIVE) {
            checkCanDeactivate(roomId);
        }

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
        checkCanDeactivate(roomId);
        registeredRoom.setActivationStatus(ActivationStatus.INACTIVE);
        roomRepository.save(registeredRoom);
    }

    private void checkCanDeactivate(int roomId) {
        if (reservationRepository.existsByRoom_RoomIdAndStatusNotAndCheckOutDateAfter(
                roomId, ReservationStatus.CANCELLED, LocalDate.now())) {
            throw new FieldException(HttpStatus.CONFLICT, "activationStatus",
                    "This room cannot be deactivated because it has upcoming or ongoing reservations. Cancel or reassign those reservations first.");
        }
    }

    /** El tipo es un campo del formulario: si falta o ya no existe, el error va en ese campo. */
    private void resolveRoomType(Room room) {
        Integer roomTypeId = room.getRoomType() == null ? null : room.getRoomType().getRoomTypeId();
        if (roomTypeId == null) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "roomType", "Select a room type.");
        }
        room.setRoomType(roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new FieldException(HttpStatus.BAD_REQUEST, "roomType",
                        "The selected room type no longer exists.")));
    }

    /** El número físico es único: si otra habitación ya lo usa se responde 409 y la pantalla muestra el motivo. */
    private void checkNumberIsFree(Integer number, Integer roomId) {
        Room existingRoom = roomRepository.findByNumber(number).orElse(null);
        if (existingRoom != null && !existingRoom.getRoomId().equals(roomId)) {
            throw new FieldException(HttpStatus.CONFLICT, "number", "Room number " + number + " is already in use.");
        }
    }

}
