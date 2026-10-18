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
        for (Room room : rooms.findAvailableForBooking(checkIn, checkOut, guests, null)) {
            RoomType type = room.getRoomType();
            result.putIfAbsent(type.getRoomTypeId(), typeView(type));
        }
        if (result.isEmpty()) {
            Integer maximum = rooms.findMaximumBookableCapacity();
            if (maximum == null)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "No rooms are currently enabled for booking. Please contact the hotel.");
            if (guests > maximum)
                throw problem("No bookable room can accommodate " + guests + " guests. The maximum is " + maximum + ". Please reduce the number of guests.");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No rooms are available for the selected dates and guest count. Please change the dates or the number of guests.");
        }
        return new ArrayList<>(result.values());
    }

    public BookingQuote quote(Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, Integer guests, List<Integer> serviceIds) {
        checkStay(checkIn, checkOut, guests);
        RoomType type = types.findById(roomTypeId).orElseThrow(() -> problem("Room type not found."));
        if (type.getMaxCapacity() < guests)
            throw problem("This room type accommodates at most " + type.getMaxCapacity() + " guests. Please reduce the number of guests or choose another room type.");
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
        Room room = rooms.findAvailableForBooking(input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount(), null)
            .stream().filter(candidate -> candidate.getRoomType().getRoomTypeId().equals(typeId)).findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "The selected room type is no longer available for these dates and guests. Please choose another room type, change the dates or reduce the number of guests."));
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

    public void update(Integer id, Reservation input) {
        Reservation current = reservations.lockForEditing(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        if (input.getCheckInDate() == null || input.getCheckOutDate() == null)
            throw problem("Choose both a check-in and a check-out date.");
        if (!input.getCheckOutDate().isAfter(input.getCheckInDate()))
            throw problem("The check-out date must be after the check-in date.");
        if (input.getGuestCount() == null || input.getGuestCount() < 1) throw problem("Enter at least one guest.");
        if (input.getStatus() == null) throw problem("Choose a reservation status.");
        Integer typeId = input.getRoom().getRoomType().getRoomTypeId();
        RoomType type = types.lockForBooking(typeId).orElseThrow(() -> problem("Room type not found."));
        if (input.getGuestCount() > type.getMaxCapacity())
            throw problem("This room type accommodates at most " + type.getMaxCapacity() + " guests. Please reduce the number of guests or choose another room type.");
        boolean sameType = current.getRoom() != null && current.getRoom().getRoomType().getRoomTypeId().equals(typeId);
        boolean stayChanged = !sameType || !current.getCheckInDate().equals(input.getCheckInDate())
            || !current.getCheckOutDate().equals(input.getCheckOutDate());
        Room assigned = current.getRoom();
        if (input.getStatus() != ReservationStatus.CANCELLED && (stayChanged
                || !current.getGuestCount().equals(input.getGuestCount()) || current.getStatus() == ReservationStatus.CANCELLED)) {
            List<Room> candidates = rooms.findAvailableForBooking(input.getCheckInDate(), input.getCheckOutDate(), input.getGuestCount(), id)
                .stream().filter(room -> room.getRoomType().getRoomTypeId().equals(typeId)).toList();
            assigned = candidates.stream().filter(room -> current.getRoom() != null && room.getRoomId().equals(current.getRoom().getRoomId()))
                .findFirst().orElseGet(() -> candidates.stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                    "No room of the selected type is available. Please change the dates, room type or number of guests.")));
        } else if (!sameType) {
            assigned = rooms.findAll().stream().filter(room -> room.getRoomType().getRoomTypeId().equals(typeId)).findFirst()
                .orElseThrow(() -> problem("The selected room type has no rooms."));
        }
        Set<Integer> oldServices = new HashSet<>(current.getServices().stream().map(com.example.demo.entities.Service::getServiceId).toList());
        List<Integer> selectedIds = input.getServices().stream().map(com.example.demo.entities.Service::getServiceId).distinct().toList();
        List<com.example.demo.entities.Service> selected = selectedIds.stream().map(serviceId -> services.findById(serviceId)
            .filter(service -> oldServices.contains(serviceId) || service.getActivationStatus() == ActivationStatus.ACTIVE)
            .orElseThrow(() -> problem("A selected service is no longer available."))).toList();
        boolean financialChange = stayChanged || !oldServices.equals(new HashSet<>(selectedIds));
        BigDecimal nightly = sameType ? current.getNightlyPrice() : type.getNightlyPrice();
        ReservationDetailDTO previous = detail(id);
        Folio folio = folios.findByReservation_ReservationId(id).orElseGet(() -> folios.save(Folio.builder()
            .reservation(current).issuedAt(current.getCreatedAt()).status(FolioStatus.PENDING).build()));
        List<FolioItem> charges = new ArrayList<>(items.findByFolio_FolioIdOrderByChargedAtAsc(folio.getFolioId()));
        // Retained services and independent charges keep their contracted price snapshots.
        List<FolioItem> removed = charges.stream().filter(item -> item.getService() != null
            && !selectedIds.contains(item.getService().getServiceId())).toList();
        charges.removeAll(removed);
        for (com.example.demo.entities.Service service : selected) {
            if (charges.stream().noneMatch(item -> item.getService() != null && item.getService().getServiceId().equals(service.getServiceId()))) {
                charges.add(FolioItem.builder().folio(folio).service(service).concept(service.getName()).unitPrice(service.getPrice())
                    .quantity(1).chargedAt(LocalDateTime.now()).build());
            }
        }
        BigDecimal total = nightly.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(input.getCheckInDate(), input.getCheckOutDate())))
            .add(charges.stream().map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add));
        BigDecimal paid = previous.paidTotal();
        if (financialChange && paid.signum() > 0 && total.compareTo(paid) <= 0)
            throw problem("The recalculated total must be greater than the amount already paid (COP " + paid.toPlainString() + "). Payments cannot be changed here.");
        ReservationStatus status = input.getStatus();
        if (financialChange && paid.signum() > 0 && previous.total().compareTo(paid) == 0
                && total.compareTo(paid) > 0 && status != ReservationStatus.CANCELLED) status = ReservationStatus.PENDING;
        current.setCheckInDate(input.getCheckInDate()); current.setCheckOutDate(input.getCheckOutDate());
        current.setGuestCount(input.getGuestCount()); current.setRoom(assigned); current.setNightlyPrice(nightly);
        current.setServices(new ArrayList<>(selected)); current.setStatus(status);
        items.deleteAll(removed); items.saveAll(charges);
        folio.setStatus(status == ReservationStatus.CANCELLED ? FolioStatus.CANCELLED : total.compareTo(paid) == 0 ? FolioStatus.PAID : FolioStatus.PENDING);
    }

    public void delete(Integer id) {
        Reservation reservation = reservations.lockForEditing(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        folios.findByReservation_ReservationId(id).ifPresent(folio -> {
            payments.deleteAll(payments.findByFolio_FolioIdOrderByPaidAtAsc(folio.getFolioId()));
            items.deleteAll(items.findByFolio_FolioIdOrderByChargedAtAsc(folio.getFolioId()));
            folios.delete(folio);
            folios.flush();
        });
        reservations.delete(reservation);
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
            .map(service -> new ReservationDetailDTO.Charge(null, service.getServiceId(), service.getName(), 1, service.getPrice(), service.getPrice(), null)).toList()
            : charges.stream().map(item -> new ReservationDetailDTO.Charge(item.getItemId(), item.getService() == null ? null : item.getService().getServiceId(), item.getConcept(), item.getQuantity(),
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
        if (checkIn == null || checkOut == null) throw problem("Choose both a check-in and a check-out date.");
        if (checkIn.isBefore(LocalDate.now())) throw problem("The check-in date cannot be in the past. Please choose new dates.");
        if (!checkOut.isAfter(checkIn)) throw problem("The check-out date must be after the check-in date.");
        if (guests == null || guests < 1) throw problem("Enter at least one guest.");
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
