package com.example.demo.controller;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.service.interfaces.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reservations")
@CrossOrigin("http://localhost:4200")
public class ReservationController {

    private final ReservationService service;
    private final com.example.demo.service.BookingService booking;

    public ReservationController(ReservationService service, com.example.demo.service.BookingService booking) {
        this.service = service; this.booking = booking;
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
    @GetMapping("/available-room-types")
    public List<com.example.demo.dto.RoomTypeListDTO> listAvailableRoomTypes(@RequestParam java.time.LocalDate checkIn,
            @RequestParam java.time.LocalDate checkOut, @RequestParam Integer guests) {
        return booking.available(checkIn, checkOut, guests);
    }
    @GetMapping("/quote")
    public com.example.demo.dto.BookingQuote readReservationQuote(@RequestParam Integer roomTypeId,
            @RequestParam java.time.LocalDate checkIn, @RequestParam java.time.LocalDate checkOut,
            @RequestParam Integer guests, @RequestParam(required = false) List<Integer> serviceIds) {
        return booking.quote(roomTypeId, checkIn, checkOut, guests, serviceIds);
    }
    @PostMapping
    public com.example.demo.dto.ReservationDetailDTO createReservation(@Valid @RequestBody com.example.demo.entities.Reservation reservation) {
        return booking.create(reservation);
    }
    @PutMapping("/{id}")
    public void updateReservation(@PathVariable Integer id, @Valid @RequestBody com.example.demo.entities.Reservation reservation) {
        booking.update(id, reservation);
    }
    @DeleteMapping("/{id}")
    public void deleteReservation(@PathVariable Integer id) {
        booking.delete(id);
    }
    @GetMapping("/{id}/details")
    public com.example.demo.dto.ReservationDetailDTO readReservationDetails(@PathVariable Integer id) {
        return booking.detail(id);
    }
    @GetMapping("/history")
    public List<com.example.demo.dto.ReservationDetailDTO> listClientReservationHistory(@RequestParam Integer clientId) {
        return booking.history(clientId);
    }
}
