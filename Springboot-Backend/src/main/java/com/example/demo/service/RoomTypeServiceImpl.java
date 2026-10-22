package com.example.demo.service;

import com.example.demo.dto.RoomTypeDetailDTO;
import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.RoomTypeService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD del catálogo de tipos de habitación. */
@Service
@Transactional
public class RoomTypeServiceImpl implements RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    private final RoomRepository roomRepository;

    public RoomTypeServiceImpl(RoomTypeRepository roomTypeRepository, RoomRepository roomRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
    }

    @Override
    public List<RoomTypeListDTO> listTypes() {
        return roomTypeRepository.findAllForList();
    }

    @Override
    public List<RoomTypeOptionDTO> listOptions() {
        return roomTypeRepository.findAllForOptions();
    }

    @Override
    public RoomTypeDetailDTO findDetail(int roomTypeId) {
        return RoomTypeDetailDTO.from(findById(roomTypeId));
    }

    @Override
    public RoomType findByName(String name) {
        return roomTypeRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found."));
    }

    @Override
    public RoomType findById(int roomTypeId) {
        return roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room type not found."));
    }

    @Override
    public void create(RoomType roomType) {
        // El id lo genera la base de datos (IDENTITY): se manda en null para que
        // Hibernate haga un INSERT. El formulario nunca lo envía.
        roomType.setRoomTypeId(null);

        checkNameIsFree(roomType.getName(), null);
        normalizePhotos(roomType);
        roomTypeRepository.save(roomType);
    }

    @Override
    public void update(int roomTypeId, RoomType roomType) {
        RoomType registeredRoomType = findById(roomTypeId);

        // Se conserva el id que ya tenía el tipo para que save() actualice esa
        // fila en vez de crear un registro nuevo.
        checkNameIsFree(roomType.getName(), registeredRoomType.getRoomTypeId());
        roomType.setRoomTypeId(registeredRoomType.getRoomTypeId());

        normalizePhotos(roomType);
        roomTypeRepository.save(roomType);
    }

    @Override
    public void delete(int roomTypeId) {
        RoomType registeredRoomType = findById(roomTypeId);

        // Las habitaciones dependen de su tipo: el repositorio las cuenta con una consulta
        // y, si hay alguna, primero hay que reasignarlas o borrarlas.
        long rooms = roomRepository.countByRoomType_RoomTypeId(registeredRoomType.getRoomTypeId());
        if (rooms > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The room type \"" + registeredRoomType.getName() + "\" cannot be deleted because "
                            + rooms + " room(s) use it.");
        }

        roomTypeRepository.delete(registeredRoomType);
    }

    /** El nombre del tipo es único: si otro tipo ya lo usa se responde 409 y el formulario muestra el motivo. */
    private void checkNameIsFree(String name, Integer roomTypeId) {
        RoomType existingType = roomTypeRepository.findByNameIgnoreCase(name == null ? "" : name.trim()).orElse(null);
        if (existingType != null && !existingType.getRoomTypeId().equals(roomTypeId)) {
            throw new FieldException(HttpStatus.CONFLICT, "name",
                    "Another room type is already called \"" + existingType.getName() + "\".");
        }
    }

    /** Limpia URLs vacías para mantener una galería válida por cada tipo de habitación. */
    private void normalizePhotos(RoomType roomType) {
        if (roomType.getMainPhoto() != null) {
            roomType.setMainPhoto(roomType.getMainPhoto().trim());
        }

        if (roomType.getSecondaryPhotos() != null) {
            // removeIf retira las fotos vacías de la colección sin modificarla durante un for.
            roomType.getSecondaryPhotos().removeIf(photo -> photo == null || photo.isBlank());
        } else {
            roomType.setSecondaryPhotos(new ArrayList<>());
        }
    }
}
