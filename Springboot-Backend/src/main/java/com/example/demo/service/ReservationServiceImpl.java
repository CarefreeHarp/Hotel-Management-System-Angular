package com.example.demo.service;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Operator;
import com.example.demo.entities.Room;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.entities.enums.RoomStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.ReservationService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Consulta y administra reservas existentes. Las ediciones y eliminaciones
 * mantienen su bloqueo hasta confirmar o revertir todos los cambios del folio.
 */
@org.springframework.stereotype.Service
// La transacción confirma todos los cambios juntos o los revierte si falla una etapa.
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ReservationRules reservationRules;
    private final ReservationBillingService billingService;
    private final OperatorRepository operatorRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
            RoomRepository roomRepository, RoomTypeRepository roomTypeRepository,
            ReservationRules reservationRules, ReservationBillingService billingService,
            OperatorRepository operatorRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.reservationRules = reservationRules;
        this.billingService = billingService;
        this.operatorRepository = operatorRepository;
    }

    @Override
    public List<ReservationDTO> listReservations() {
        return reservationRepository.findAllForList();
    }

    @Override
    public List<ReservationDTO> listByClient(Integer clientId) {
        return reservationRepository.findAllForListByClientId(clientId);
    }

    @Override
    public ReservationDTO findDetail(Integer reservationId) {
        return ReservationDTO.from(reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found.")));
    }

    @Override
    public int clearClient(Integer clientId) {
        return reservationRepository.clearClient(clientId);
    }

    @Override
    public long countByRoom(Integer roomId) {
        return reservationRepository.countByRoom_RoomId(roomId);
    }

    @Override
    public long countByService(Integer serviceId) {
        return reservationRepository.countByServices_ServiceId(serviceId);
    }

    /**
     * Bloquea la reserva, revisa la estancia, asigna habitación y recalcula su
     * folio antes de aplicar cambios.
     */
    @Override
    public void updateReservation(Integer id, Reservation input) {
        Reservation current = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        applyUpdate(current, input);
    }

    /** El cliente edita estancias futuras; durante la estancia solo añade servicios. Conserva tipo y estado. */
    @Override
    public void updateClientReservation(Integer id, Integer clientId, Reservation input) {
        Reservation current = clientReservation(id, clientId);
        if (current.getStatus() == ReservationStatus.CHECKED_IN) {
            if (!current.getCheckInDate().equals(input.getCheckInDate()))
                throw invalid("checkInDate", "The arrival date cannot be changed during the stay.");
            if (!current.getCheckOutDate().equals(input.getCheckOutDate()))
                throw invalid("checkOutDate", "The departure date cannot be changed during the stay.");
            if (!current.getGuestCount().equals(input.getGuestCount()))
                throw invalid("guestCount", "The guest count cannot be changed during the stay.");
            Set<Integer> selected = new HashSet<>(reservationRules.serviceIds(input));
            for (Service service : current.getServices()) {
                if (!selected.contains(service.getServiceId()))
                    throw invalid("services", "Existing services cannot be removed during the stay. You can only add services.");
            }
        } else if ((current.getStatus() != ReservationStatus.PENDING && current.getStatus() != ReservationStatus.CONFIRMED)
                || current.getCheckInDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only upcoming pending or confirmed reservations can be modified.");
        }
        if (current.getRoom() == null) {
            throw invalid("roomType", "This reservation has no assigned room. Please contact the hotel.");
        }
        input.setRoom(current.getRoom());
        input.setStatus(current.getStatus());
        applyUpdate(current, input);
    }

    /** Abono y cambios financieros comparten el bloqueo para no cobrar o devolver sobre un saldo desactualizado. */
    @Override
    public ReservationDetailDTO addClientPayment(Integer id, Integer clientId, Payment payment) {
        Reservation current = clientReservation(id, clientId);
        checkPaymentAllowed(current);
        billingService.addCardPayment(current, payment);
        return billingService.detail(current);
    }

    /** El operario registra efectivo sobre el mismo saldo que usa el pago del cliente. */
    @Override
    public ReservationDetailDTO addOperatorCashPayment(Integer id, Integer operatorId, Payment payment) {
        Reservation current = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator not found."));
        checkPaymentAllowed(current);
        billingService.addCashPayment(current, operator, payment == null ? null : payment.getAmount());
        return billingService.detail(current);
    }

    private void checkPaymentAllowed(Reservation current) {
        // El huésped alojado salda su cuenta antes del check-out, también el día de salida o con la salida vencida.
        boolean inHouse = current.getStatus() == ReservationStatus.CHECKED_IN;
        boolean upcoming = (current.getStatus() == ReservationStatus.PENDING
                || current.getStatus() == ReservationStatus.CONFIRMED)
                && current.getCheckOutDate().isAfter(LocalDate.now());
        if (!inHouse && !upcoming) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payments are only allowed for upcoming or ongoing reservations.");
        }
    }

    /** El proyecto identifica al cliente por la URL. Se verifica que coincida con el dueño persistido. */
    private Reservation clientReservation(Integer id, Integer clientId) {
        Reservation current = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        if (current.getClient() == null || !current.getClient().getClientId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found for this client.");
        }
        return current;
    }

    private void applyUpdate(Reservation current, Reservation input) {
        // Las estancias ya iniciadas o pasadas conservan su llegada. Una llegada nueva
        // no puede ser pasada.
        reservationRules.checkDates(input.getCheckInDate(), input.getCheckOutDate(),
                current.getCheckInDate().equals(input.getCheckInDate()));
        if (input.getGuestCount() == null || input.getGuestCount() < 1)
            throw invalid("guestCount", "Enter at least one guest.");
        if (input.getStatus() == null)
            throw invalid("status", "Choose a reservation status.");
        // El estado persistido determina la transición. Se revisa bajo el bloqueo y antes de cambiar habitación o folio.
        if (current.getStatus() == ReservationStatus.PENDING && input.getStatus() == ReservationStatus.CHECKED_IN)
            throw invalid("status", "Check-in is not allowed while the reservation is pending. Confirm the reservation first.");
        Integer typeId = reservationRules.roomTypeId(input);
        RoomType type = roomTypeRepository.lockForBooking(typeId)
                .orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        reservationRules.checkCapacity(type, input.getGuestCount());
        boolean sameType = current.getRoom() != null && current.getRoom().getRoomType().getRoomTypeId().equals(typeId);
        boolean stayChanged = !sameType || !current.getCheckInDate().equals(input.getCheckInDate())
                || !current.getCheckOutDate().equals(input.getCheckOutDate());
        Room assigned = selectRoomForUpdate(current, input, typeId, sameType, stayChanged);
        Set<Integer> oldServices = new HashSet<>();
        for (Service service : current.getServices()) {
            oldServices.add(service.getServiceId());
        }
        List<Integer> selectedIds = reservationRules.serviceIds(input);
        // Un servicio inactivo solo puede conservarse si ya formaba parte de esta
        // reserva.
        List<Service> selected = reservationRules.resolveServices(selectedIds, oldServices);
        boolean financialChange = stayChanged || !oldServices.equals(new HashSet<>(selectedIds));
        BigDecimal nightly = sameType ? current.getNightlyPrice() : type.getNightlyPrice();
        ReservationStatus status = billingService.updateFolio(current, input, nightly, selected, financialChange);
        current.setCheckInDate(input.getCheckInDate());
        current.setCheckOutDate(input.getCheckOutDate());
        current.setGuestCount(input.getGuestCount());
        current.setRoom(assigned);
        current.setNightlyPrice(nightly);
        current.setServices(new ArrayList<>(selected));
        current.setStatus(status);
    }

    /**
     * Bloquea la reserva, reembolsa el pagado neto y cancela su folio en la misma transacción. No reasigna
     * habitación ni recalcula cargos, incluso si la estancia ya pasó.
     */
    @Override
    public void cancelReservation(Integer id) {
        Reservation reservation = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        billingService.cancelFolio(id);
        reservation.setStatus(ReservationStatus.CANCELLED);
    }

    /**
     * Check-in del tablero del operario. Exige una reserva confirmada cuya estancia
     * incluya hoy y una habitación lista. El formulario de edición conserva su cambio
     * manual de estado sin tocar la habitación.
     */
    @Override
    public void checkIn(Integer id) {
        Reservation reservation = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        if (reservation.getStatus() == ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Check-in is not allowed while the reservation is pending. Confirm the reservation first.");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only confirmed reservations can be checked in.");
        }
        LocalDate today = LocalDate.now();
        if (reservation.getCheckInDate().isAfter(today) || !reservation.getCheckOutDate().isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Check-in is only allowed between the arrival date and the day before departure.");
        }
        Room room = reservation.getRoom();
        if (room == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This reservation has no assigned room.");
        }
        if (room.getStatus() == RoomStatus.CLEANING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room " + room.getNumber() + " is being cleaned. Mark it as ready before checking in.");
        }
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room " + room.getNumber() + " is under maintenance. End the maintenance or move the reservation to another room first.");
        }
        if (room.getStatus() == RoomStatus.OCCUPIED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Room " + room.getNumber() + " is still occupied. Check out the previous guest first.");
        }
        room.setStatus(RoomStatus.OCCUPIED);
        reservation.setStatus(ReservationStatus.CHECKED_IN);
    }

    /**
     * Check-out del tablero. Mantiene la regla del formulario: no se registra la
     * salida con saldo pendiente. La habitación queda en limpieza salvo que esté en
     * mantenimiento, que tiene prioridad.
     */
    @Override
    public void checkOut(Integer id) {
        Reservation reservation = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only checked-in reservations can be checked out.");
        }
        if (billingService.detail(reservation).balance().signum() > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Check-out is not allowed while the reservation has an outstanding balance. Settle the balance first.");
        }
        reservation.setStatus(ReservationStatus.CHECKED_OUT);
        Room room = reservation.getRoom();
        if (room != null && room.getStatus() != RoomStatus.MAINTENANCE) {
            room.setStatus(RoomStatus.CLEANING);
        }
    }

    /** Bloquea la reserva y elimina primero sus dependencias financieras. */
    @Override
    public void deleteReservation(Integer id) {
        Reservation reservation = reservationRepository.lockForEditing(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        billingService.deleteFolio(id);
        reservationRepository.delete(reservation);
    }

    /**
     * Compone el historial del cliente con los mismos detalles que la consulta
     * individual.
     */
    @Override
    public List<ReservationDetailDTO> listClientHistory(Integer clientId) {
        List<ReservationDetailDTO> history = new ArrayList<>();
        for (ReservationDTO reservation : reservationRepository.findAllForListByClientId(clientId)) {
            history.add(readReservationDetails(reservation.getReservationId()));
        }
        return history;
    }

    /**
     * Busca la reserva y delega la lectura de cargos, pagos y saldo al servicio de
     * facturación.
     */
    @Override
    public ReservationDetailDTO readReservationDetails(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        return billingService.detail(reservation);
    }

    /**
     * Conserva la habitación si sigue disponible. Al cancelar no exige
     * disponibilidad.
     */
    private Room selectRoomForUpdate(Reservation current, Reservation input, Integer typeId,
            boolean sameType, boolean stayChanged) {
        boolean needsAvailableRoom = input.getStatus() != ReservationStatus.CANCELLED
                && (stayChanged || !current.getGuestCount().equals(input.getGuestCount())
                        || current.getStatus() == ReservationStatus.CANCELLED);
        if (needsAvailableRoom) {
            List<Room> candidates = new ArrayList<>();
            for (Room room : roomRepository.findAvailableForBooking(
                    input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount(),
                    current.getReservationId())) {
                if (room.getRoomType().getRoomTypeId().equals(typeId)) {
                    candidates.add(room);
                }
            }
            Room previousRoom = current.getRoom();
            // Evita trasladar al huésped si su habitación actual aún sirve para la nueva
            // estancia.
            if (previousRoom != null) {
                for (Room candidate : candidates) {
                    if (candidate.getRoomId().equals(previousRoom.getRoomId())) {
                        return candidate;
                    }
                }
            }
            if (candidates.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "No room of the selected type is available. Please change the dates, room type or number of guests.");
            }
            return candidates.get(0);
        }
        if (!sameType) {
            for (Room room : roomRepository.findAll()) {
                if (room.getRoomType().getRoomTypeId().equals(typeId)) {
                    return room;
                }
            }
            throw invalid("roomType", "The selected room type has no rooms.");
        }
        return current.getRoom();
    }

    /** Asocia la regla incumplida con el campo que debe corregir Angular. */
    private FieldException invalid(String field, String message) {
        return new FieldException(HttpStatus.BAD_REQUEST, field, message);
    }
}
