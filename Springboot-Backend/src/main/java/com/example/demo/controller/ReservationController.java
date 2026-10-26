package com.example.demo.controller;

import com.example.demo.dto.BookingQuote;
import com.example.demo.dto.ReservationDTO;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.dto.RoomTypeAvailability;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Payment;
import com.example.demo.service.BookingService;
import com.example.demo.service.interfaces.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reservations")
@CrossOrigin("http://localhost:4200")
public class ReservationController {

    private final ReservationService reservationService;
    private final BookingService bookingService;

    public ReservationController(ReservationService reservationService, BookingService bookingService) {
        this.reservationService = reservationService;
        this.bookingService = bookingService;
    }

    @GetMapping
    @Operation(summary = "Listar reservas", description = "Devuelve todas las reservas o solo las de un cliente si se envía clientId, con los datos que muestra su perfil.")
    public List<ReservationDTO> listReservations(
            @Parameter(description = "Optional client ID to filter the reservations", example = "1") @RequestParam(required = false) Integer clientId) {
        return clientId == null ? reservationService.listReservations() : reservationService.listByClient(clientId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar una reserva")
    public ReservationDTO readReservation(
            @Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return reservationService.findDetail(id);
    }

    @GetMapping("/available-room-types")
    public List<RoomTypeAvailability> listAvailableRoomTypes(@RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut, @RequestParam Integer guests) {
        return bookingService.listAvailableRoomTypes(checkIn, checkOut, guests);
    }

    @GetMapping("/quote")
    public BookingQuote readReservationQuote(@RequestParam Integer roomTypeId,
            @RequestParam LocalDate checkIn, @RequestParam LocalDate checkOut,
            @RequestParam Integer guests, @RequestParam(required = false) List<Integer> serviceIds) {
        return bookingService.quoteReservation(roomTypeId, checkIn, checkOut, guests, serviceIds);
    }

    @PostMapping
    public ReservationDetailDTO createReservation(@Valid @RequestBody Reservation reservation) {
        return bookingService.createReservation(reservation);
    }

    @PutMapping("/{id}")
    public void updateReservation(@PathVariable Integer id, @Valid @RequestBody Reservation reservation) {
        reservationService.updateReservation(id, reservation);
    }

    /** El cuerpo solo aporta fechas, huéspedes y servicios. La pertenencia se comprueba en el servicio. */
    @PutMapping("/{id}/client")
    public void updateClientReservation(@PathVariable Integer id, @RequestParam Integer clientId,
            @Valid @RequestBody Reservation reservation) {
        reservationService.updateClientReservation(id, clientId, reservation);
    }

    /** Reutiliza la validación de tarjeta de la reserva inicial y fuerza CARD en el servidor. */
    @PostMapping("/{id}/payments")
    public ReservationDetailDTO addClientPayment(@PathVariable Integer id, @RequestParam Integer clientId,
            @RequestBody Payment payment) {
        return reservationService.addClientPayment(id, clientId, payment);
    }

    /** El servidor fija CASH y relaciona el pago con el operario de la URL. */
    @PostMapping("/{id}/cash-payments")
    public ReservationDetailDTO addOperatorCashPayment(@PathVariable Integer id, @RequestParam Integer operatorId,
            @RequestBody Payment payment) {
        return reservationService.addOperatorCashPayment(id, operatorId, payment);
    }

    /** Cancela y reembolsa los pagos pendientes de devolución sin borrar el historial financiero. */
    @PutMapping("/{id}/cancel")
    public void cancelReservation(@PathVariable Integer id) {
        reservationService.cancelReservation(id);
    }

    /** Check-in del tablero del operario: también marca la habitación como ocupada. */
    @PutMapping("/{id}/check-in")
    public void checkIn(@PathVariable Integer id) {
        reservationService.checkIn(id);
    }

    /** Check-out con saldo cero: la habitación pasa a limpieza. */
    @PutMapping("/{id}/check-out")
    public void checkOut(@PathVariable Integer id) {
        reservationService.checkOut(id);
    }

    @DeleteMapping("/{id}")
    public void deleteReservation(@PathVariable Integer id) {
        reservationService.deleteReservation(id);
    }

    @GetMapping("/{id}/details")
    public ReservationDetailDTO readReservationDetails(@PathVariable Integer id) {
        return reservationService.readReservationDetails(id);
    }

    @GetMapping("/history")
    public List<ReservationDetailDTO> listClientReservationHistory(@RequestParam Integer clientId) {
        return reservationService.listClientHistory(clientId);
    }
}
