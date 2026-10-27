package com.example.demo.controller;

import com.example.demo.dto.RoomDetailDTO;
import com.example.demo.dto.RoomListDTO;
import com.example.demo.entities.Room;
import com.example.demo.service.interfaces.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rooms")
@CrossOrigin("http://localhost:4200")
public class RoomController {

    private final RoomService service;

    public RoomController(RoomService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar habitaciones", description = "Devuelve las filas de la tabla del panel (activas e inactivas) con solo las columnas que se muestran.")
    public List<RoomListDTO> listRooms() {
        return service.listRooms();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar una habitación", description = "Devuelve el detalle de la habitación junto con el de su tipo.")
    public RoomDetailDTO readRoom(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear una habitación", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createRoom(@Valid @RequestBody Room room) {
        service.create(room);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una habitación", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene. roomType.roomTypeId debe corresponder a un tipo de habitación existente.")
    public void updateRoom(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
            @Valid @RequestBody Room room) {
        service.update(id, room);
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Desactivar una habitación", description = "La habitación se conserva con sus reservas y pasa a la sección de inactivas.")
    public void deactivateRoom(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.deactivate(id);
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activar una habitación", description = "La habitación vuelve a la lista principal.")
    public void activateRoom(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.activate(id);
    }

    @PutMapping("/{id}/ready")
    @Operation(summary = "Marcar una habitación como lista", description = "Termina la limpieza o el mantenimiento desde el tablero del operario. La habitación vuelve a AVAILABLE, u OCCUPIED si tiene un huésped alojado.")
    public void markRoomReady(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.markReady(id);
    }
}
