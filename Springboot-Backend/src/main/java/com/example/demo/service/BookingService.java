package com.example.demo.service;

import com.example.demo.entities.enums.ActivationStatus;

import com.example.demo.dto.*;
import com.example.demo.entities.*;
import com.example.demo.entities.enums.*;
import com.example.demo.repository.*;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class BookingService {
    private final RoomRepository rooms;
    private final RoomTypeRepository types;
    private final ClientRepository clients;
    private final ServiceRepository services;
    private final ReservationRepository reservations;
    private final FolioRepository folios;
    private final FolioItemRepository items;
    private final PaymentRepository payments;

    public BookingService(RoomRepository rooms, RoomTypeRepository types, ClientRepository clients,
            ServiceRepository services, ReservationRepository reservations, FolioRepository folios,
            FolioItemRepository items, PaymentRepository payments) {
        this.rooms = rooms; this.types = types; this.clients = clients; this.services = services;
        this.reservations = reservations; this.folios = folios; this.items = items; this.payments = payments;
    }

    public List<RoomTypeListDTO> available(LocalDate checkIn, LocalDate checkOut, Integer guests) {
        checkStay(checkIn, checkOut, guests);
        Map<Integer, RoomTypeListDTO> result = new LinkedHashMap<>();
        for (Room room : rooms.findAvailableForBooking(checkIn, checkOut, guests)) {
            RoomType type = room.getRoomType();
            result.putIfAbsent(type.getRoomTypeId(), typeView(type));
        }
        return new ArrayList<>(result.values());
    }

    public BookingQuote quote(Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, Integer guests, List<Integer> serviceIds) {
        checkStay(checkIn, checkOut, guests);
        RoomType type = types.findById(roomTypeId).orElseThrow(() -> problem("Room type not found."));
        if (type.getMaxCapacity() < guests) throw problem("The guest count exceeds the room capacity.");
        List<com.example.demo.entities.Service> selected = selectedServices(serviceIds);
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal stayTotal = type.getNightlyPrice().multiply(BigDecimal.valueOf(nights));
        BigDecimal servicesTotal = selected.stream().map(com.example.demo.entities.Service::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subtotal = stayTotal.add(servicesTotal);
        return new BookingQuote(typeView(type), checkIn, checkOut, guests, nights, stayTotal,
            selected.stream().map(this::serviceView).toList(), servicesTotal, subtotal, subtotal);
    }

    public ReservationDetailDTO create(Reservation input) {
        Integer typeId = input.getRoom().getRoomType().getRoomTypeId();
        types.lockForBooking(typeId).orElseThrow(() -> problem("Room type not found."));
        List<Integer> serviceIds = input.getServices().stream().map(com.example.demo.entities.Service::getServiceId).toList();
        BookingQuote quote = quote(typeId, input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount(), serviceIds);
        Room room = rooms.findAvailableForBooking(input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount())
            .stream().filter(candidate -> candidate.getRoomType().getRoomTypeId().equals(typeId)).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "This room type is no longer available. Please choose another type."));
        Payment initial = input.getInitialPayment();
        if (initial != null) checkPayment(initial, quote.total());
        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = reservations.save(Reservation.builder()
            .reservationCode("ATL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .checkInDate(input.getCheckInDate()).checkOutDate(input.getCheckOutDate())
            .guestCount(input.getGuestCount()).nightlyPrice(quote.roomType().getNightlyPrice())
            .createdAt(now).status(ReservationStatus.PENDING)
            .client(clients.findById(input.getClient().getClientId()).orElseThrow(() -> problem("Client not found.")))
            .room(room).services(selectedServices(serviceIds)).build());
        Folio folio = folios.save(Folio.builder().reservation(reservation).issuedAt(now).status(FolioStatus.PENDING).build());
        for (com.example.demo.entities.Service selected : reservation.getServices()) {
            items.save(FolioItem.builder().folio(folio).service(selected).concept(selected.getName())
                .unitPrice(selected.getPrice()).quantity(1).chargedAt(now).build());
        }
        if (initial != null) {
            payments.save(Payment.builder().folio(folio).amount(initial.getAmount()).paymentMethod("CARD")
                .status(PaymentStatus.APPROVED).paidAt(now).build());
            if (initial.getAmount().compareTo(quote.total()) == 0) {
                folio.setStatus(FolioStatus.PAID); reservation.setStatus(ReservationStatus.CONFIRMED);
            }
        }
        return detail(reservation.getReservationId());
    }

    public List<ReservationDetailDTO> history(Integer clientId) {
        return reservations.findAllForListByClientId(clientId).stream().map(row -> detail(row.getReservationId())).toList();
    }

    public ReservationDetailDTO detail(Integer id) {
        Reservation reservation = reservations.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        Folio folio = folios.findByReservation_ReservationId(id).orElse(null);
        List<FolioItem> charges = folio == null ? List.of() : items.findByFolio_FolioIdOrderByChargedAtAsc(folio.getFolioId());
        List<Payment> records = folio == null ? List.of() : payments.findByFolio_FolioIdOrderByPaidAtAsc(folio.getFolioId());
        long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate());
        BigDecimal subtotal = reservation.getNightlyPrice().multiply(BigDecimal.valueOf(nights));
        // Existing demonstration reservations have no folio; use their linked services until charges exist.
        subtotal = subtotal.add(folio == null ? reservation.getServices().stream().map(com.example.demo.entities.Service::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add) : charges.stream().map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add));
        BigDecimal total = subtotal;
        BigDecimal paid = records.stream().filter(payment -> payment.getStatus() == PaymentStatus.APPROVED)
            .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Room room = reservation.getRoom();
        List<ReservationDetailDTO.Charge> chargeViews = folio == null ? reservation.getServices().stream()
            .map(service -> new ReservationDetailDTO.Charge(null, service.getName(), 1, service.getPrice(), service.getPrice(), null)).toList()
            : charges.stream().map(item -> new ReservationDetailDTO.Charge(item.getItemId(), item.getConcept(), item.getQuantity(),
                item.getUnitPrice(), item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())), item.getChargedAt())).toList();
        return new ReservationDetailDTO(ReservationDTO.from(reservation), reservation.getClient() == null ? null : reservation.getClient().getClientId(),
            room == null ? null : room.getFloor(), room == null ? null : room.getRoomType().getMaxCapacity(), reservation.getCreatedAt(),
            reservation.getNightlyPrice(), nights, folio == null ? null : folio.getFolioId(), folio == null ? null : folio.getStatus().name(),
            folio == null ? null : folio.getIssuedAt(), subtotal, total, paid, total.subtract(paid), chargeViews,
            records.stream().map(payment -> new ReservationDetailDTO.PaymentView(payment.getPaymentId(), payment.getAmount(), payment.getPaymentMethod(),
                payment.getStatus().name(), payment.getPaidAt(), payment.getOperator() == null ? "Client self-service" : payment.getOperator().getName() + " " + payment.getOperator().getLastName())).toList(),
            room == null ? null : room.getRoomType().getMainPhoto());
    }

    private void checkStay(LocalDate checkIn, LocalDate checkOut, Integer guests) {
        if (checkIn == null || checkOut == null || checkIn.isBefore(LocalDate.now()) || !checkOut.isAfter(checkIn) || guests == null || guests < 1)
            throw problem("Choose valid future dates and at least one guest.");
    }
    private List<com.example.demo.entities.Service> selectedServices(List<Integer> ids) {
        if (ids == null) return List.of();
        return ids.stream().distinct().map(id -> services.findById(id).filter(service -> service.getActivationStatus() == ActivationStatus.ACTIVE)
            .orElseThrow(() -> problem("A selected service is no longer available."))).toList();
    }
    private void checkPayment(Payment payment, BigDecimal total) {
        if (payment.getAmount() == null || payment.getAmount().compareTo(new BigDecimal("100000")) < 0 || payment.getAmount().compareTo(total) > 0)
            throw problem("Payment must be at least COP 100,000 and cannot exceed the total.");
        String expiry = payment.getExpiryDate();
        String month = expiry == null ? "" : expiry.split("/", -1)[0];
        if (!month.matches("[0-9]{1,2}") || Integer.parseInt(month) < 1 || Integer.parseInt(month) > 12)
            throw problem("Enter an expiry month from 1 to 12.");
    }
    private ResponseStatusException problem(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private RoomTypeListDTO typeView(RoomType type) { return new RoomTypeListDTO(type.getRoomTypeId(), type.getName(), type.getDescription(), type.getNightlyPrice(), type.getMaxCapacity(), type.getMainPhoto()); }
    private ServiceCatalogDTO serviceView(com.example.demo.entities.Service service) { return new ServiceCatalogDTO(service.getServiceId(), service.getName(), service.getSummary(), service.getDescription(), service.getCategory(), service.getPrice(), service.getDuration(), service.getAvailability(), service.getLocation(), service.getMainImageUrl()); }
}
