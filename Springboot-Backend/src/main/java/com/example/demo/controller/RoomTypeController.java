package com.example.demo.controller;

import com.example.demo.dto.RoomTypeDetailDTO;
import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeOptionDTO;
import com.example.demo.entities.RoomType;
import com.example.demo.service.interfaces.RoomTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/room-types")
@CrossOrigin("http://localhost:4200")
public class RoomTypeController {

    private final RoomTypeService service;

    public RoomTypeController(RoomTypeService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar tipos de habitación", description = "Devuelve las filas de la tabla con solo las columnas que se muestran (sin las fotos secundarias).")
    public List<RoomTypeListDTO> listRoomTypes() {
        return service.listTypes();
    }

    @GetMapping("/options")
    @Operation(summary = "Opciones de tipos de habitación", description = "Solo el id y el nombre, para el selector del formulario de habitaciones.")
    public List<RoomTypeOptionDTO> listRoomTypeOptions() {
        return service.listOptions();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un tipo de habitación", description = "Devuelve todos los atributos del tipo, incluida su galería.")
    public RoomTypeDetailDTO readRoomType(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear un tipo de habitación", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createRoomType(@Valid @RequestBody RoomType roomType) {
        service.create(roomType);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un tipo de habitación", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene.")
    public void updateRoomType(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
            @Valid @RequestBody RoomType roomType) {
        service.update(id, roomType);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un tipo de habitación", description = "Elimina el registro. La respuesta exitosa no tiene cuerpo.")
    public void deleteRoomType(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.delete(id);
    }
}
