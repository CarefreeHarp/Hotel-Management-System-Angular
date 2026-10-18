package com.example.demo.service;

import com.example.demo.dto.RoomTypeDetailDTO;
import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.RoomTypeService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Operaciones CRUD del catálogo de tipos de habitación. */
@Service
@org.springframework.transaction.annotation.Transactional
public class RoomTypeServiceImpl implements RoomTypeService {

    @Autowired
    public RoomTypeRepository typeRoomRepository;

    @Autowired
    public RoomRepository roomRepository;

    @Override
    public List<RoomTypeListDTO> listTypes() {
        return typeRoomRepository.findAllForList();
    }

    @Override
    public List<RoomTypeOptionDTO> listOptions() {
        return typeRoomRepository.findAllForOptions();
    }

    @Override
    public RoomTypeDetailDTO findDetail(int roomTypeId) {
        return RoomTypeDetailDTO.from(findById(roomTypeId));
    }

    @Override
    public RoomType findByName(String name) {
        return typeRoomRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found."));
    }

    @Override
    public RoomType findById(int roomTypeId) {
        return typeRoomRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found."));
    }

    @Override
    public void create(RoomType typeRoom) {
        // El id lo genera la base de datos (IDENTITY): se manda en null para que
        // Hibernate haga un INSERT. El formulario nunca lo envía.
        typeRoom.setRoomTypeId(null);

        checkNameIsFree(typeRoom.getName(), null);
        normalizePhotos(typeRoom);
        typeRoomRepository.save(typeRoom);
    }

    @Override
    public void update(int roomTypeId, RoomType typeRoom) {
        RoomType typeRegistered = findById(roomTypeId);

        // Se conserva el id que ya tenía el tipo para que save() actualice esa
        // fila en vez de crear un registro nuevo.
        checkNameIsFree(typeRoom.getName(), typeRegistered.getRoomTypeId());
        typeRoom.setRoomTypeId(typeRegistered.getRoomTypeId());

        normalizePhotos(typeRoom);
        typeRoomRepository.save(typeRoom);
    }

    @Override
    public void delete(int roomTypeId) {
        RoomType typeRegistered = findById(roomTypeId);

        // Las habitaciones dependen de su tipo: el repositorio las cuenta con una consulta
        // y, si hay alguna, primero hay que reasignarlas o borrarlas.
        long rooms = roomRepository.countByRoomType_RoomTypeId(typeRegistered.getRoomTypeId());
        if (rooms > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The room type \"" + typeRegistered.getName() + "\" cannot be deleted because "
                            + rooms + " room(s) use it.");
        }

        typeRoomRepository.delete(typeRegistered);
    }

    /** El nombre del tipo es único: si otro tipo ya lo usa se responde 409 y el formulario muestra el motivo. */
    private void checkNameIsFree(String name, Integer roomTypeId) {
        typeRoomRepository.findByNameIgnoreCase(name == null ? "" : name.trim())
                .filter(other -> !other.getRoomTypeId().equals(roomTypeId))
                .ifPresent(other -> {
                    throw new FieldException(HttpStatus.CONFLICT, "name",
                            "Another room type is already called \"" + other.getName() + "\".");
                });
    }

    /** Limpia URLs vacías para mantener una galería válida por cada tipo de habitación. */
    private void normalizePhotos(RoomType typeRoom) {
        if (typeRoom.getMainPhoto() != null) {
            typeRoom.setMainPhoto(typeRoom.getMainPhoto().trim());
        }

        if (typeRoom.getSecondaryPhotos() != null) {
            typeRoom.getSecondaryPhotos().removeIf(photo -> photo == null || photo.isBlank());
        } else {
            typeRoom.setSecondaryPhotos(new java.util.ArrayList<>());
        }
    }
}
