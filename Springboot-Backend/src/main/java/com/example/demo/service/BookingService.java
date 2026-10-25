package com.example.demo.service;

import com.example.demo.dto.BookingQuote;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.dto.RoomTypeListDTO;
import com.example.demo.dto.RoomTypeAvailability;
import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.entities.Client;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ClientRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Prepara y crea reservas nuevas: disponibilidad, cotización y asignación
 * de habitación dentro de la transacción de creación.
 */
@org.springframework.stereotype.Service
// La transacción confirma todos los cambios juntos o los revierte si falla una etapa.
@Transactional
public class BookingService {
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ClientRepository clientRepository;
    private final ReservationRules reservationRules;
    private final ReservationRepository reservationRepository;
    private final ReservationBillingService billingService;
    private final BookingPaymentValidator paymentValidator;

    public BookingService(RoomRepository roomRepository, RoomTypeRepository roomTypeRepository,
            ClientRepository clientRepository, ReservationRules reservationRules,
            ReservationRepository reservationRepository, ReservationBillingService billingService,
            BookingPaymentValidator paymentValidator) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.clientRepository = clientRepository;
        this.reservationRules = reservationRules;
        this.reservationRepository = reservationRepository;
        this.billingService = billingService;
        this.paymentValidator = paymentValidator;
    }

    /**
     * Valida la estancia y cuenta las habitaciones disponibles por tipo para todas
     * las noches y huéspedes de la búsqueda. Explica si no hay opciones.
     */
    public List<RoomTypeAvailability> listAvailableRoomTypes(LocalDate checkIn, LocalDate checkOut, Integer guests) {
        reservationRules.checkNewStay(checkIn, checkOut, guests);
        Map<Integer, RoomTypeAvailability> result = new LinkedHashMap<>();
        for (Room room : roomRepository.findAvailableForBooking(checkIn, checkOut, guests, null)) {
            RoomType type = room.getRoomType();
            RoomTypeAvailability current = result.get(type.getRoomTypeId());
            // La misma consulta determina las opciones y su conteo. No cuenta habitaciones ocupadas en parte de la estancia.
            if (current == null) {
                result.put(type.getRoomTypeId(), new RoomTypeAvailability(typeView(type), 1));
            } else {
                result.put(type.getRoomTypeId(),
                        new RoomTypeAvailability(current.roomType(), current.availableRooms() + 1));
            }
        }
        if (result.isEmpty()) {
            Integer maximum = roomRepository.findMaximumBookableCapacity();
            if (maximum == null)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "No rooms are currently enabled for booking. Please contact the hotel.");
            if (guests > maximum)
                throw invalid("guestCount", "No bookable room can accommodate " + guests + " guests. The maximum is "
                        + maximum + ". Please reduce the number of guests.");
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No rooms are available for the selected dates and guest count. Please change the dates or the number of guests.");
        }
        return new ArrayList<>(result.values());
    }

    /**
     * Valida fechas, capacidad y servicios. Calcula noches, alojamiento y total sin
     * guardar nada.
     */
    public BookingQuote quoteReservation(Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, Integer guests,
            List<Integer> serviceIds) {
        reservationRules.checkNewStay(checkIn, checkOut, guests);
        RoomType type = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        reservationRules.checkCapacity(type, guests);
        List<Service> selected = reservationRules.selectedServices(serviceIds);
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal stayTotal = type.getNightlyPrice().multiply(BigDecimal.valueOf(nights));
        BigDecimal servicesTotal = BigDecimal.ZERO;
        List<ServiceCatalogDTO> serviceOptions = new ArrayList<>();
        for (Service service : selected) {
            servicesTotal = servicesTotal.add(service.getPrice());
            serviceOptions.add(serviceView(service));
        }
        BigDecimal subtotal = stayTotal.add(servicesTotal);
        return new BookingQuote(typeView(type), checkIn, checkOut, guests, nights, stayTotal,
                serviceOptions, servicesTotal, subtotal, subtotal);
    }

    /**
     * Resuelve el cliente, bloquea el tipo, cotiza, asigna habitación y guarda
     * reserva y folio.
     */
    public ReservationDetailDTO createReservation(Reservation input) {
        Integer typeId = reservationRules.roomTypeId(input);
        Client client = client(input);
        // El bloqueo se mantiene hasta terminar la transacción. Después se consulta la
        // disponibilidad real.
        roomTypeRepository.lockForBooking(typeId)
                .orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        List<Integer> serviceIds = reservationRules.serviceIds(input);
        BookingQuote quote = quoteReservation(typeId, input.getCheckInDate(), input.getCheckOutDate(),
                input.getGuestCount(), serviceIds);
        Room room = selectAvailableRoom(input, typeId);
        Payment initial = input.getInitialPayment();
        if (initial != null) {
            paymentValidator.validate(initial, quote.total());
        }
        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = reservationRepository.save(Reservation.builder()
                .reservationCode("ATL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .checkInDate(input.getCheckInDate()).checkOutDate(input.getCheckOutDate())
                .guestCount(input.getGuestCount()).nightlyPrice(quote.roomType().getNightlyPrice())
                .createdAt(now).status(ReservationStatus.PENDING)
                .client(client)
                .room(room).services(reservationRules.selectedServices(serviceIds)).build());
        billingService.createFolio(reservation, initial, quote.total());
        return billingService.detail(reservation);
    }

    /** Busca la primera habitación del tipo después de adquirir el bloqueo de asignación. */
    private Room selectAvailableRoom(Reservation input, Integer typeId) {
        List<Room> availableRooms = roomRepository.findAvailableForBooking(
                input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount(), null);
        for (Room room : availableRooms) {
            if (room.getRoomType().getRoomTypeId().equals(typeId)) {
                return room;
            }
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "The selected room type is no longer available for these dates and guests. Please choose another room type, change the dates or reduce the number of guests.");
    }

    /** Resuelve el cliente persistido a partir del identificador recibido. */
    private Client client(Reservation input) {
        Integer id = input.getClient() == null ? null : input.getClient().getClientId();
        if (id == null)
            throw problem("Sign in to make a reservation.");
        return clientRepository.findById(id).orElseThrow(() -> problem("Client not found. Please sign in again."));
    }

    /** Mantiene la respuesta general de error del contrato existente. */
    private ResponseStatusException problem(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    /** Asocia la regla incumplida con el campo que debe corregir Angular. */
    private FieldException invalid(String field, String message) {
        return new FieldException(HttpStatus.BAD_REQUEST, field, message);
    }

    /**
     * Proyecta el tipo a los datos utilizados en el catálogo y en la cotización.
     */
    // El constructor recibe los datos que necesita la pantalla, sin enviar la entidad completa.
    private RoomTypeListDTO typeView(RoomType type) {
        return new RoomTypeListDTO(type.getRoomTypeId(), type.getName(), type.getDescription(), type.getNightlyPrice(),
                type.getMaxCapacity(), type.getMainPhoto());
    }

    /** Proyecta un servicio del catálogo sin exponer relaciones de persistencia. */
    private ServiceCatalogDTO serviceView(Service service) {
        return new ServiceCatalogDTO(service.getServiceId(), service.getName(), service.getSummary(),
                service.getDescription(), service.getCategory(), service.getPrice(), service.getDuration(),
                service.getAvailability(), service.getLocation(), service.getMainImageUrl());
    }
}
