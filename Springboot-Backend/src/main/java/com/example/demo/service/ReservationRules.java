package com.example.demo.service;

import com.example.demo.entities.Reservation;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ServiceRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Reglas compartidas de estancia y selección de servicios para crear o editar
 * reservas. No asigna habitaciones, modifica reservas ni administra folios.
 */
@Component
public class ReservationRules {
    // Los mismos límites se aplican en los formularios de reserva de Angular.
    private static final int MAX_NIGHTS = 90;
    private static final int MAX_YEARS_AHEAD = 2;

    private final ServiceRepository serviceRepository;

    public ReservationRules(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    /**
     * Reserva nueva: la llegada no puede ser pasada y debe haber al menos un
     * huésped.
     */
    public void checkNewStay(LocalDate checkIn, LocalDate checkOut, Integer guests) {
        checkDates(checkIn, checkOut, false);
        if (guests == null || guests < 1) {
            throw invalid("guestCount", "Enter at least one guest.");
        }
    }

    /**
     * Fechas obligatorias, salida posterior a la llegada, máximo 90 noches y hasta
     * dos años de antelación.
     */
    public void checkDates(LocalDate checkIn, LocalDate checkOut, boolean allowPastCheckIn) {
        if (checkIn == null) {
            throw invalid("checkInDate", "Choose a check-in date.");
        }
        if (checkOut == null) {
            throw invalid("checkOutDate", "Choose a check-out date.");
        }
        if (!allowPastCheckIn && checkIn.isBefore(LocalDate.now())) {
            throw invalid("checkInDate", "The check-in date cannot be in the past. Please choose new dates.");
        }
        if (checkIn.isAfter(LocalDate.now().plusYears(MAX_YEARS_AHEAD))) {
            throw invalid("checkInDate", "Reservations can be made at most " + MAX_YEARS_AHEAD + " years in advance.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw invalid("checkOutDate", "The check-out date must be after the check-in date.");
        }
        if (ChronoUnit.DAYS.between(checkIn, checkOut) > MAX_NIGHTS) {
            throw invalid("checkOutDate", "A stay cannot exceed " + MAX_NIGHTS + " nights.");
        }
    }

    /** Compara los huéspedes con la capacidad del tipo seleccionado. */
    public void checkCapacity(RoomType type, Integer guests) {
        if (guests > type.getMaxCapacity()) {
            throw invalid("guestCount", "This room type accommodates at most " + type.getMaxCapacity()
                    + " guests. Please reduce the number of guests or choose another room type.");
        }
    }

    /**
     * Extrae el tipo solicitado del objeto anidado. La habitación física la elige
     * el backend.
     */
    public Integer roomTypeId(Reservation input) {
        Integer id = input.getRoom() == null || input.getRoom().getRoomType() == null ? null
                : input.getRoom().getRoomType().getRoomTypeId();
        if (id == null) {
            throw invalid("roomType", "Select a room type.");
        }
        return id;
    }

    /** Extrae identificadores únicos de los servicios recibidos en la reserva. */
    public List<Integer> serviceIds(Reservation input) {
        List<Integer> ids = new ArrayList<>();
        if (input.getServices() == null) {
            return ids;
        }
        for (Service service : input.getServices()) {
            if (service == null || service.getServiceId() == null) {
                throw invalid("services", "A selected service is no longer available.");
            }
            Integer id = service.getServiceId();
            if (!ids.contains(id)) {
                ids.add(id);
            }
        }
        return ids;
    }

    /**
     * Resuelve los identificadores sin aceptar cambios en los datos del catálogo.
     */
    public List<Service> resolveServices(List<Integer> ids, Set<Integer> retainedIds) {
        List<Service> selected = new ArrayList<>();
        if (ids == null) {
            return selected;
        }
        Set<Integer> resolvedIds = new HashSet<>();
        for (Integer id : ids) {
            if (resolvedIds.contains(id)) {
                continue;
            }
            resolvedIds.add(id);
            if (id == null) {
                throw invalid("services", "A selected service is no longer available.");
            }
            // Optional representa un resultado que podría no existir. Aquí se conserva el error del campo.
            Service service = serviceRepository.findById(id)
                    .orElseThrow(() -> invalid("services", "A selected service is no longer available."));
            boolean retained = retainedIds.contains(id);
            boolean active = service.getActivationStatus() == ActivationStatus.ACTIVE;
            if (!retained && !active) {
                throw invalid("services", "A selected service is no longer available.");
            }
            selected.add(service);
        }
        return selected;
    }

    /**
     * En una reserva nueva todos los servicios seleccionados deben seguir activos.
     */
    public List<Service> selectedServices(List<Integer> ids) {
        return resolveServices(ids, Set.of());
    }

    /** Asocia la regla incumplida con el campo que debe corregir Angular. */
    private FieldException invalid(String field, String message) {
        return new FieldException(HttpStatus.BAD_REQUEST, field, message);
    }
}
