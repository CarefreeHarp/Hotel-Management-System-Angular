package com.example.demo.service;

import java.time.LocalDateTime;
import com.example.demo.dto.ReservationDTO;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Folio;
import com.example.demo.entities.FolioItem;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.FolioStatus;
import com.example.demo.entities.enums.PaymentStatus;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.FolioItemRepository;
import com.example.demo.repository.FolioRepository;
import com.example.demo.repository.PaymentRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Folios, cargos históricos y pagos. Participa en la transacción de la reserva. */
@org.springframework.stereotype.Service
@Transactional
public class ReservationBillingService {
    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final PaymentRepository paymentRepository;

    public ReservationBillingService(FolioRepository folioRepository,
            FolioItemRepository folioItemRepository, PaymentRepository paymentRepository) {
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.paymentRepository = paymentRepository;
    }

    /** Crea los cargos con su precio contratado y registra el pago inicial si existe. */
    public void createFolio(Reservation reservation, Payment initialPayment, BigDecimal total) {
        LocalDateTime createdAt = reservation.getCreatedAt();
        Folio folio = folioRepository.save(Folio.builder()
                .reservation(reservation).issuedAt(createdAt).status(FolioStatus.PENDING).build());
        for (Service service : reservation.getServices()) {
            folioItemRepository.save(serviceCharge(folio, service, createdAt));
        }
        if (initialPayment == null) {
            return;
        }

        // Se guardan el importe y el resultado simulado, nunca los datos de tarjeta.
        paymentRepository.save(Payment.builder()
                .folio(folio).amount(initialPayment.getAmount()).paymentMethod("CARD")
                .status(PaymentStatus.APPROVED).paidAt(createdAt).build());
        if (initialPayment.getAmount().compareTo(total) == 0) {
            folio.setStatus(FolioStatus.PAID);
            reservation.setStatus(ReservationStatus.CONFIRMED);
        }
    }

    /** Conserva cargos contratados, aplica los servicios cambiados y comprueba el saldo antes de guardar. */
    public ReservationStatus updateFolio(Reservation current, Reservation input,
            BigDecimal nightlyPrice, List<Service> selectedServices, boolean financialChange) {
        ReservationDetailDTO previous = detail(current);
        Folio folio = folioRepository.findByReservation_ReservationId(current.getReservationId()).orElse(null);
        if (folio == null) {
            folio = folioRepository.save(Folio.builder().reservation(current)
                    .issuedAt(current.getCreatedAt()).status(FolioStatus.PENDING).build());
        }
        List<FolioItem> charges = new ArrayList<>(charges(folio));
        List<Integer> selectedIds = new ArrayList<>();
        for (Service service : selectedServices) {
            selectedIds.add(service.getServiceId());
        }

        // Los servicios conservados y los cargos independientes mantienen el precio contratado.
        List<FolioItem> removed = new ArrayList<>();
        for (FolioItem item : charges) {
            if (item.getService() != null && !selectedIds.contains(item.getService().getServiceId())) {
                removed.add(item);
            }
        }
        charges.removeAll(removed);
        for (Service service : selectedServices) {
            boolean alreadyCharged = false;
            for (FolioItem item : charges) {
                if (item.getService() != null && item.getService().getServiceId().equals(service.getServiceId())) {
                    alreadyCharged = true;
                    break;
                }
            }
            if (!alreadyCharged) {
                charges.add(serviceCharge(folio, service, LocalDateTime.now()));
            }
        }

        BigDecimal total = stayTotal(input, nightlyPrice).add(chargesTotal(charges));
        BigDecimal paid = previous.paidTotal();
        checkBalance(input.getStatus(), total, paid, financialChange);
        ReservationStatus status = input.getStatus();
        // Si una reserva pagada aumenta de precio, vuelve a quedar pendiente de pago.
        if (financialChange && paid.signum() > 0 && previous.total().compareTo(paid) == 0
                && total.compareTo(paid) > 0 && status != ReservationStatus.CANCELLED) {
            status = ReservationStatus.PENDING;
        }
        folioItemRepository.deleteAll(removed);
        folioItemRepository.saveAll(charges);
        folio.setStatus(folioStatus(status, total, paid));
        return status;
    }

    public void deleteFolio(Integer reservationId) {
        Folio folio = folioRepository.findByReservation_ReservationId(reservationId).orElse(null);
        if (folio == null) {
            return;
        }
        // Las referencias se eliminan antes que el folio para respetar las llaves foráneas.
        paymentRepository.deleteAll(payments(folio));
        folioItemRepository.deleteAll(charges(folio));
        folioRepository.delete(folio);
        folioRepository.flush();
    }

    /** Compone el DTO con los cargos históricos y calcula lo pagado y lo pendiente. */
    public ReservationDetailDTO detail(Reservation reservation) {
        Folio folio = folioRepository.findByReservation_ReservationId(reservation.getReservationId()).orElse(null);
        List<FolioItem> charges = charges(folio);
        List<Payment> payments = payments(folio);
        long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate());
        // Las reservas de demostración sin folio aún toman sus cargos de los servicios asociados.
        BigDecimal servicesTotal = BigDecimal.ZERO;
        List<ReservationDetailDTO.Charge> chargeViews = new ArrayList<>();
        if (folio == null) {
            for (Service service : reservation.getServices()) {
                servicesTotal = servicesTotal.add(service.getPrice());
                chargeViews.add(legacyChargeView(service));
            }
        } else {
            servicesTotal = chargesTotal(charges);
            for (FolioItem item : charges) {
                chargeViews.add(chargeView(item));
            }
        }
        BigDecimal total = stayTotal(reservation, reservation.getNightlyPrice()).add(servicesTotal);
        BigDecimal paid = BigDecimal.ZERO;
        List<ReservationDetailDTO.PaymentView> paymentViews = new ArrayList<>();
        for (Payment payment : payments) {
            if (payment.getStatus() == PaymentStatus.APPROVED) {
                paid = paid.add(payment.getAmount());
            }
            paymentViews.add(paymentView(payment));
        }
        Room room = reservation.getRoom();
        return new ReservationDetailDTO(ReservationDTO.from(reservation),
                reservation.getClient() == null ? null : reservation.getClient().getClientId(),
                room == null ? null : room.getFloor(),
                room == null ? null : room.getRoomType().getMaxCapacity(),
                reservation.getCreatedAt(), reservation.getNightlyPrice(), nights,
                folio == null ? null : folio.getFolioId(), folio == null ? null : folio.getStatus().name(),
                folio == null ? null : folio.getIssuedAt(), total, total, paid, total.subtract(paid),
                chargeViews, paymentViews,
                room == null ? null : room.getRoomType().getMainPhoto());
    }

    private void checkBalance(ReservationStatus status, BigDecimal total, BigDecimal paid, boolean financialChange) {
        if (status == ReservationStatus.CHECKED_OUT && total.compareTo(paid) > 0) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "status",
                    "Check-out is not allowed while the reservation has an outstanding balance. Settle the balance first.");
        }
        if (financialChange && paid.signum() > 0 && total.compareTo(paid) <= 0) {
            NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
            format.setMaximumFractionDigits(2);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The recalculated total must be greater than the amount already paid (COP "
                            + format.format(paid) + "). Payments cannot be changed here.");
        }
    }

    private FolioStatus folioStatus(ReservationStatus status, BigDecimal total, BigDecimal paid) {
        if (status == ReservationStatus.CANCELLED) {
            return FolioStatus.CANCELLED;
        }
        return total.compareTo(paid) == 0 ? FolioStatus.PAID : FolioStatus.PENDING;
    }

    private List<FolioItem> charges(Folio folio) {
        return folio == null ? List.of()
                : folioItemRepository.findByFolio_FolioIdOrderByChargedAtAsc(folio.getFolioId());
    }

    private List<Payment> payments(Folio folio) {
        return folio == null ? List.of()
                : paymentRepository.findByFolio_FolioIdOrderByPaidAtAsc(folio.getFolioId());
    }

    private BigDecimal stayTotal(Reservation reservation, BigDecimal nightlyPrice) {
        long nights = ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate());
        return nightlyPrice.multiply(BigDecimal.valueOf(nights));
    }

    private BigDecimal chargesTotal(List<FolioItem> charges) {
        BigDecimal total = BigDecimal.ZERO;
        for (FolioItem item : charges) {
            total = total.add(chargeTotal(item));
        }
        return total;
    }

    // BigDecimal no se modifica al sumar o multiplicar. Cada operación devuelve un nuevo importe.
    private BigDecimal chargeTotal(FolioItem item) {
        return item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }

    private FolioItem serviceCharge(Folio folio, Service service, LocalDateTime chargedAt) {
        return FolioItem.builder().folio(folio).service(service).concept(service.getName())
                .unitPrice(service.getPrice()).quantity(1).chargedAt(chargedAt).build();
    }

    private ReservationDetailDTO.Charge legacyChargeView(Service service) {
        return new ReservationDetailDTO.Charge(null, service.getServiceId(), service.getName(),
                1, service.getPrice(), service.getPrice(), null);
    }

    private ReservationDetailDTO.Charge chargeView(FolioItem item) {
        return new ReservationDetailDTO.Charge(item.getItemId(),
                item.getService() == null ? null : item.getService().getServiceId(), item.getConcept(),
                item.getQuantity(), item.getUnitPrice(), chargeTotal(item), item.getChargedAt());
    }

    private ReservationDetailDTO.PaymentView paymentView(Payment payment) {
        String operatorName = payment.getOperator() == null ? "Client self-service"
                : payment.getOperator().getName() + " " + payment.getOperator().getLastName();
        return new ReservationDetailDTO.PaymentView(payment.getPaymentId(), payment.getAmount(),
                payment.getPaymentMethod(), payment.getStatus().name(), payment.getPaidAt(), operatorName);
    }
}
