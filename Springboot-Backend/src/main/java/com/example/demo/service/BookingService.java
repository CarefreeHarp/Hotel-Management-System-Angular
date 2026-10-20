package com.example.demo.service;

import com.example.demo.entities.enums.ActivationStatus;

import com.example.demo.dto.*;
import com.example.demo.entities.*;
import com.example.demo.entities.enums.*;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.*;
import java.math.*;
import java.text.NumberFormat;
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
    // Límites de una reserva y del pago simulado. El pago máximo es el de la columna decimal(10,2).
    private static final int MAX_NIGHTS = 90;
    private static final int MAX_YEARS_AHEAD = 2;
    private static final BigDecimal MIN_PAYMENT = new BigDecimal("100000");
    private static final BigDecimal MAX_PAYMENT = new BigDecimal("99999999.99");

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
        checkNewStay(checkIn, checkOut, guests);
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
                throw invalid("guestCount", "No bookable room can accommodate " + guests + " guests. The maximum is " + maximum + ". Please reduce the number of guests.");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No rooms are available for the selected dates and guest count. Please change the dates or the number of guests.");
        }
        return new ArrayList<>(result.values());
    }

    public BookingQuote quote(Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, Integer guests, List<Integer> serviceIds) {
        checkNewStay(checkIn, checkOut, guests);
        RoomType type = types.findById(roomTypeId).orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        checkCapacity(type, guests);
        List<com.example.demo.entities.Service> selected = selectedServices(serviceIds);
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal stayTotal = type.getNightlyPrice().multiply(BigDecimal.valueOf(nights));
        BigDecimal servicesTotal = selected.stream().map(com.example.demo.entities.Service::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subtotal = stayTotal.add(servicesTotal);
        return new BookingQuote(typeView(type), checkIn, checkOut, guests, nights, stayTotal,
            selected.stream().map(this::serviceView).toList(), servicesTotal, subtotal, subtotal);
    }

    public ReservationDetailDTO create(Reservation input) {
        Integer typeId = roomTypeId(input);
        Client client = client(input);
        types.lockForBooking(typeId).orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        List<Integer> serviceIds = serviceIds(input);
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
            .client(client)
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
        // Las estancias ya iniciadas o pasadas conservan su llegada; una llegada nueva no puede ser pasada.
        checkDates(input.getCheckInDate(), input.getCheckOutDate(), current.getCheckInDate().equals(input.getCheckInDate()));
        if (input.getGuestCount() == null || input.getGuestCount() < 1) throw invalid("guestCount", "Enter at least one guest.");
        if (input.getStatus() == null) throw invalid("status", "Choose a reservation status.");
        Integer typeId = roomTypeId(input);
        RoomType type = types.lockForBooking(typeId).orElseThrow(() -> invalid("roomType", "The selected room type does not exist."));
        checkCapacity(type, input.getGuestCount());
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
                .orElseThrow(() -> invalid("roomType", "The selected room type has no rooms."));
        }
        Set<Integer> oldServices = new HashSet<>(current.getServices().stream().map(com.example.demo.entities.Service::getServiceId).toList());
        List<Integer> selectedIds = serviceIds(input);
        List<com.example.demo.entities.Service> selected = selectedIds.stream().map(serviceId -> services.findById(serviceId)
            .filter(service -> oldServices.contains(serviceId) || service.getActivationStatus() == ActivationStatus.ACTIVE)
            .orElseThrow(() -> invalid("services", "A selected service is no longer available."))).toList();
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
        if (input.getStatus() == ReservationStatus.CHECKED_OUT && total.compareTo(paid) > 0)
            throw invalid("status", "Check-out is not allowed while the reservation has an outstanding balance. Settle the balance first.");
        if (financialChange && paid.signum() > 0 && total.compareTo(paid) <= 0)
            throw problem("The recalculated total must be greater than the amount already paid (" + cop(paid) + "). Payments cannot be changed here.");
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

    /** Reserva nueva: la llegada no puede ser pasada y debe haber al menos un huésped. */
    private void checkNewStay(LocalDate checkIn, LocalDate checkOut, Integer guests) {
        checkDates(checkIn, checkOut, false);
        if (guests == null || guests < 1) throw invalid("guestCount", "Enter at least one guest.");
    }
    /** Fechas obligatorias, salida posterior a la llegada, máximo 90 noches y hasta dos años de antelación. */
    private void checkDates(LocalDate checkIn, LocalDate checkOut, boolean allowPastCheckIn) {
        if (checkIn == null) throw invalid("checkInDate", "Choose a check-in date.");
        if (checkOut == null) throw invalid("checkOutDate", "Choose a check-out date.");
        if (!allowPastCheckIn && checkIn.isBefore(LocalDate.now()))
            throw invalid("checkInDate", "The check-in date cannot be in the past. Please choose new dates.");
        if (checkIn.isAfter(LocalDate.now().plusYears(MAX_YEARS_AHEAD)))
            throw invalid("checkInDate", "Reservations can be made at most " + MAX_YEARS_AHEAD + " years in advance.");
        if (!checkOut.isAfter(checkIn)) throw invalid("checkOutDate", "The check-out date must be after the check-in date.");
        if (ChronoUnit.DAYS.between(checkIn, checkOut) > MAX_NIGHTS)
            throw invalid("checkOutDate", "A stay cannot exceed " + MAX_NIGHTS + " nights.");
    }
    private void checkCapacity(RoomType type, Integer guests) {
        if (guests > type.getMaxCapacity())
            throw invalid("guestCount", "This room type accommodates at most " + type.getMaxCapacity() + " guests. Please reduce the number of guests or choose another room type.");
    }
    private Integer roomTypeId(Reservation input) {
        Integer id = input.getRoom() == null || input.getRoom().getRoomType() == null ? null : input.getRoom().getRoomType().getRoomTypeId();
        if (id == null) throw invalid("roomType", "Select a room type.");
        return id;
    }
    private Client client(Reservation input) {
        Integer id = input.getClient() == null ? null : input.getClient().getClientId();
        if (id == null) throw problem("Sign in to make a reservation.");
        return clients.findById(id).orElseThrow(() -> problem("Client not found. Please sign in again."));
    }
    private List<Integer> serviceIds(Reservation input) {
        if (input.getServices() == null) return List.of();
        if (input.getServices().stream().anyMatch(service -> service == null || service.getServiceId() == null))
            throw invalid("services", "A selected service is no longer available.");
        return input.getServices().stream().map(com.example.demo.entities.Service::getServiceId).distinct().toList();
    }
    private List<com.example.demo.entities.Service> selectedServices(List<Integer> ids) {
        if (ids == null) return List.of();
        return ids.stream().distinct().map(id -> Optional.ofNullable(id).flatMap(services::findById)
            .filter(service -> service.getActivationStatus() == ActivationStatus.ACTIVE)
            .orElseThrow(() -> invalid("services", "A selected service is no longer available."))).toList();
    }
    /** Pago simulado: importe permitido y datos de tarjeta con formato válido; informa todos los campos a la vez. */
    private void checkPayment(Payment payment, BigDecimal total) {
        Map<String, String> errors = new LinkedHashMap<>();
        BigDecimal amount = payment.getAmount();
        if (amount == null) errors.put("initialPayment.amount", "Enter the amount to pay.");
        else if (amount.stripTrailingZeros().scale() > 2) errors.put("initialPayment.amount", "The amount can have at most two decimals.");
        else if (amount.compareTo(MIN_PAYMENT) < 0 || amount.compareTo(total) > 0)
            errors.put("initialPayment.amount", "Payment must be at least " + cop(MIN_PAYMENT) + " and cannot exceed the total of " + cop(total) + ".");
        else if (amount.compareTo(MAX_PAYMENT) > 0)
            errors.put("initialPayment.amount", "A single payment cannot exceed " + cop(MAX_PAYMENT) + ".");
        String name = text(payment.getCardholderName());
        if (name.isEmpty()) errors.put("initialPayment.cardholderName", "Enter the name on the card.");
        else if (name.length() > 100 || !name.matches("[\\p{L} .'-]+"))
            errors.put("initialPayment.cardholderName", "Enter the name as it appears on the card, using letters only (up to 100 characters).");
        String number = text(payment.getCardNumber()).replaceAll("[\\s-]", "");
        if (number.isEmpty()) errors.put("initialPayment.cardNumber", "Enter the card number.");
        else if (!number.matches("[0-9]{13,19}")) errors.put("initialPayment.cardNumber", "The card number must have between 13 and 19 digits.");
        String expiry = text(payment.getExpiryDate());
        if (expiry.isEmpty()) errors.put("initialPayment.expiryDate", "Enter the expiry date.");
        else if (!expiry.matches("(0[1-9]|1[0-2])/[0-9]{2}"))
            errors.put("initialPayment.expiryDate", "Enter the expiry date as MM/YY, with a month from 01 to 12.");
        else {
            YearMonth expires = YearMonth.of(2000 + Integer.parseInt(expiry.substring(3)), Integer.parseInt(expiry.substring(0, 2)));
            if (expires.isBefore(YearMonth.now())) errors.put("initialPayment.expiryDate", "The card has expired.");
            else if (expires.isAfter(YearMonth.now().plusYears(20))) errors.put("initialPayment.expiryDate", "Enter a valid expiry date.");
        }
        String code = text(payment.getSecurityCode());
        if (code.isEmpty()) errors.put("initialPayment.securityCode", "Enter the security code.");
        else if (!code.matches("[0-9]{3,4}")) errors.put("initialPayment.securityCode", "The security code must have 3 or 4 digits.");
        if (!errors.isEmpty()) throw new FieldException(HttpStatus.BAD_REQUEST, errors);
    }
    private static String text(String value) { return value == null ? "" : value.trim(); }
    private static String cop(BigDecimal amount) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMaximumFractionDigits(2);
        return "COP " + format.format(amount);
    }
    private ResponseStatusException problem(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private FieldException invalid(String field, String message) { return new FieldException(HttpStatus.BAD_REQUEST, field, message); }
    private RoomTypeListDTO typeView(RoomType type) { return new RoomTypeListDTO(type.getRoomTypeId(), type.getName(), type.getDescription(), type.getNightlyPrice(), type.getMaxCapacity(), type.getMainPhoto()); }
    private ServiceCatalogDTO serviceView(com.example.demo.entities.Service service) { return new ServiceCatalogDTO(service.getServiceId(), service.getName(), service.getSummary(), service.getDescription(), service.getCategory(), service.getPrice(), service.getDuration(), service.getAvailability(), service.getLocation(), service.getMainImageUrl()); }
}
