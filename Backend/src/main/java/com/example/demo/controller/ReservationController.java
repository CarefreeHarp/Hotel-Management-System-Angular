package com.example.demo.controller;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.service.interfaces.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reservations")
@CrossOrigin("http://localhost:4200")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar reservas", description = "Devuelve todas las reservas o solo las de un cliente si se envía clientId, con los datos que muestra su perfil.")
    public List<ReservationDTO> listReservations(@Parameter(description = "Optional client ID to filter the reservations", example = "1") @RequestParam(required = false) Integer clientId) {
        return clientId == null ? service.listReservations() : service.listByClient(clientId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar una reserva")
    public ReservationDTO readReservation(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }
}
