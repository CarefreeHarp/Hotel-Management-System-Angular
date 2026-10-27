package com.example.demo.service;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Folio;
import com.example.demo.entities.FolioItem;
import com.example.demo.entities.Operator;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Refund;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.FolioStatus;
import com.example.demo.entities.enums.PaymentStatus;
import com.example.demo.entities.enums.RefundReason;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.FolioItemRepository;
import com.example.demo.repository.FolioRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.RefundRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

/** Folios, cargos históricos, pagos y reembolsos. Participa en la transacción de la reserva. */
@org.springframework.stereotype.Service
@Transactional
public class ReservationBillingService {
    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final BookingPaymentValidator paymentValidator;

    public ReservationBillingService(FolioRepository folioRepository,
            FolioItemRepository folioItemRepository, PaymentRepository paymentRepository,
            RefundRepository refundRepository, BookingPaymentValidator paymentValidator) {
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.paymentValidator = paymentValidator;
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

    /** Conserva precios contratados y devuelve el exceso pagado si el nuevo total disminuye. */
    public ReservationStatus updateFolio(Reservation current, Reservation input,
            BigDecimal nightlyPrice, List<Service> selectedServices, boolean financialChange) {
        ReservationDetailDTO previous = detail(current);
        Folio folio = folioRepository.findByReservation_ReservationId(current.getReservationId()).orElse(null);
        if (folio == null) {
            folio = folioRepository.save(Folio.builder().reservation(current)
                    .issuedAt(current.getCreatedAt()).status(FolioStatus.PENDING).build());
        }
        List<FolioItem> charges = new ArrayList<>(charges(folio));
        List<FolioItem> removed = removedServiceCharges(charges, selectedServices);
        charges.removeAll(removed);
        addNewServiceCharges(folio, charges, selectedServices);

        BigDecimal total = stayTotal(input, nightlyPrice).add(chargesTotal(charges));
        BigDecimal paid = previous.paidTotal();
        checkBalance(input.getStatus(), total, paid);
        ReservationStatus status = input.getStatus();
        // Si una reserva confirmada y pagada aumenta de precio, vuelve a quedar pendiente de pago.
        // Un huésped ya alojado sigue CHECKED_IN: su nuevo saldo se cobra antes del check-out.
        if (financialChange && paid.signum() > 0 && previous.total().compareTo(paid) == 0
                && total.compareTo(paid) > 0 && status == ReservationStatus.CONFIRMED) {
            status = ReservationStatus.PENDING;
        }
        folioItemRepository.deleteAll(removed);
        folioItemRepository.saveAll(charges);
        if (status == ReservationStatus.CANCELLED) {
            // La edición del personal comparte la devolución idempotente bajo el bloqueo de la reserva.
            cancelFolio(current.getReservationId());
        } else {
            // paidTotal ya descuenta devoluciones anteriores: nunca se reembolsa dos veces el mismo dinero.
            if (total.compareTo(paid) < 0) {
                saveRefund(folio, paid.subtract(total), RefundReason.MODIFICATION);
                paid = total;
            }
            // Una reducción puede terminar de cubrir una reserva que antes estaba pendiente.
            if (status == ReservationStatus.PENDING && total.compareTo(paid) == 0) {
                status = ReservationStatus.CONFIRMED;
            }
            folio.setStatus(folioStatus(status, total, paid));
        }
        return status;
    }

    /** Los servicios conservados y cargos independientes mantienen sus precios históricos. */
    private List<FolioItem> removedServiceCharges(List<FolioItem> charges, List<Service> selectedServices) {
        List<Integer> selectedIds = new ArrayList<>();
        for (Service service : selectedServices) {
            selectedIds.add(service.getServiceId());
        }
        List<FolioItem> removed = new ArrayList<>();
        for (FolioItem charge : charges) {
            if (charge.getService() != null && !selectedIds.contains(charge.getService().getServiceId())) {
                removed.add(charge);
            }
        }
        return removed;
    }

    /** Solo los servicios nuevos reciben el precio vigente del catálogo al crear el cargo. */
    private void addNewServiceCharges(Folio folio, List<FolioItem> charges, List<Service> selectedServices) {
        for (Service service : selectedServices) {
            boolean alreadyCharged = false;
            for (FolioItem charge : charges) {
                if (charge.getService() != null && charge.getService().getServiceId().equals(service.getServiceId())) {
                    alreadyCharged = true;
                    break;
                }
            }
            if (!alreadyCharged) {
                charges.add(serviceCharge(folio, service, LocalDateTime.now()));
            }
        }
    }

    /**
     * Devuelve el pagado neto y cancela el folio bajo el bloqueo de la reserva que
     * mantiene el servicio coordinador. Repetir o concurrir la cancelación no
     * duplica importes ya devueltos. No crea folios ni reembolsos de importe cero.
     */
    public void cancelFolio(Integer reservationId) {
        Folio folio = folioRepository.findByReservation_ReservationId(reservationId).orElse(null);
        if (folio == null) {
            return;
        }
        BigDecimal paid = approvedPaymentsTotal(payments(folio));
        BigDecimal refunded = approvedRefundsTotal(refunds(folio));
        BigDecimal remainingRefund = paid.subtract(refunded);
        if (remainingRefund.signum() > 0) {
            saveRefund(folio, remainingRefund, RefundReason.CANCELLATION);
        }
        folio.setStatus(FolioStatus.CANCELLED);
    }

    /** Registra un abono nuevo. El coordinador mantiene bloqueada la reserva durante toda la operación. */
    public void addCardPayment(Reservation reservation, Payment input) {
        ReservationDetailDTO previous = detail(reservation);
        paymentValidator.validateAdditional(input, previous.balance());
        // El servidor decide el método y el operario: los campos enviados por el cliente no alteran el registro.
        savePayment(reservation, previous, input.getAmount(), "CARD", null);
    }

    /** Un pago presencial usa el mismo saldo y folio. El operario queda en el historial. */
    public void addCashPayment(Reservation reservation, Operator operator, BigDecimal amount) {
        ReservationDetailDTO previous = detail(reservation);
        paymentValidator.validateCash(amount, previous.balance());
        savePayment(reservation, previous, amount, "CASH", operator);
    }

    private void savePayment(Reservation reservation, ReservationDetailDTO previous,
            BigDecimal amount, String method, Operator operator) {
        Folio folio = folioRepository.findByReservation_ReservationId(reservation.getReservationId()).orElse(null);
        if (folio == null) {
            // Las reservas de demostración pueden no tener folio. Se conservan sus servicios al crearlo.
            createFolio(reservation, null, previous.total());
            folio = folioRepository.findByReservation_ReservationId(reservation.getReservationId()).orElseThrow();
        }
        // Cada abono crea una fila. los pagos y reembolsos anteriores se conservan.
        paymentRepository.save(Payment.builder().folio(folio).operator(operator).amount(amount)
                .paymentMethod(method).status(PaymentStatus.APPROVED).paidAt(LocalDateTime.now()).build());
        BigDecimal paid = previous.paidTotal().add(amount);
        folio.setStatus(folioStatus(reservation.getStatus(), previous.total(), paid));
        if (reservation.getStatus() == ReservationStatus.PENDING && previous.total().compareTo(paid) == 0) {
            reservation.setStatus(ReservationStatus.CONFIRMED);
        }
    }

    /** Devuelve primero el efectivo disponible y después lo pagado con tarjeta. */
    private void saveRefund(Folio folio, BigDecimal amount, RefundReason reason) {
        BigDecimal cashAvailable = BigDecimal.ZERO;
        for (Payment payment : payments(folio)) {
            if (payment.getStatus() == PaymentStatus.APPROVED && "CASH".equals(payment.getPaymentMethod())) {
                cashAvailable = cashAvailable.add(payment.getAmount());
            }
        }
        for (Refund refund : refunds(folio)) {
            if (refund.getStatus() == PaymentStatus.APPROVED && "CASH".equals(refund.getRefundMethod())) {
                cashAvailable = cashAvailable.subtract(refund.getAmount());
            }
        }
        if (cashAvailable.signum() > 0) {
            // min elige el menor importe para no devolver más efectivo del que recibió el hotel.
            BigDecimal cashPart = amount.min(cashAvailable);
            saveRefundRow(folio, cashPart, "CASH", reason);
            amount = amount.subtract(cashPart);
        }
        if (amount.signum() > 0) {
            saveRefundRow(folio, amount, "CARD", reason);
        }
    }

    /** PAYMENT queda intacto. cada método de devolución se registra en REFUND. */
    private void saveRefundRow(Folio folio, BigDecimal amount, String method, RefundReason reason) {
        refundRepository.save(Refund.builder().folio(folio).operator(null).amount(amount).refundMethod(method)
                .reason(reason).status(PaymentStatus.APPROVED).notes("").refundedAt(LocalDateTime.now()).build());
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

    /** Compone el detalle con cargos, pagos y reembolsos. Devuelve pagado neto y saldo cero para reservas canceladas. */
    public ReservationDetailDTO detail(Reservation reservation) {
        Folio folio = folioRepository.findByReservation_ReservationId(reservation.getReservationId()).orElse(null);
        List<FolioItem> charges = charges(folio);
        List<Payment> payments = payments(folio);
        List<Refund> refunds = refunds(folio);
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
        BigDecimal refunded = approvedRefundsTotal(refunds);
        BigDecimal paid = approvedPaymentsTotal(payments).subtract(refunded);
        List<ReservationDetailDTO.PaymentView> paymentViews = new ArrayList<>();
        for (Payment payment : payments) {
            paymentViews.add(paymentView(payment));
        }
        List<ReservationDetailDTO.RefundView> refundViews = new ArrayList<>();
        for (Refund refund : refunds) {
            refundViews.add(refundView(refund));
        }
        // Cancelar conserva el total contratado como historial, pero ya no exige pagar la estancia.
        BigDecimal balance = reservation.getStatus() == ReservationStatus.CANCELLED
                ? BigDecimal.ZERO : total.subtract(paid);
        Room room = reservation.getRoom();
        return new ReservationDetailDTO(ReservationDTO.from(reservation),
                reservation.getClient() == null ? null : reservation.getClient().getClientId(),
                room == null ? null : room.getFloor(),
                room == null ? null : room.getRoomType().getMaxCapacity(),
                reservation.getCreatedAt(), reservation.getNightlyPrice(), nights,
                folio == null ? null : folio.getFolioId(), folio == null ? null : folio.getStatus().name(),
                folio == null ? null : folio.getIssuedAt(), total, total, paid, refunded, balance,
                chargeViews, paymentViews, refundViews,
                room == null ? null : room.getRoomType().getMainPhoto());
    }

    private void checkBalance(ReservationStatus status, BigDecimal total, BigDecimal paid) {
        if (status == ReservationStatus.CHECKED_OUT && total.compareTo(paid) > 0) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "status",
                    "Check-out is not allowed while the reservation has an outstanding balance. Settle the balance first.");
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

    private List<Refund> refunds(Folio folio) {
        return folio == null ? List.of()
                : refundRepository.findByFolio_FolioIdOrderByRefundedAtAsc(folio.getFolioId());
    }

    /** Solo las operaciones aprobadas afectan el dinero recibido o devuelto. */
    private BigDecimal approvedPaymentsTotal(List<Payment> payments) {
        BigDecimal total = BigDecimal.ZERO;
        for (Payment payment : payments) {
            if (payment.getStatus() == PaymentStatus.APPROVED) {
                total = total.add(payment.getAmount());
            }
        }
        return total;
    }

    private BigDecimal approvedRefundsTotal(List<Refund> refunds) {
        BigDecimal total = BigDecimal.ZERO;
        for (Refund refund : refunds) {
            if (refund.getStatus() == PaymentStatus.APPROVED) {
                total = total.add(refund.getAmount());
            }
        }
        return total;
    }

    private ReservationDetailDTO.RefundView refundView(Refund refund) {
        String operatorName = refund.getOperator() == null ? "Client self-service"
                : refund.getOperator().getName() + " " + refund.getOperator().getLastName();
        return new ReservationDetailDTO.RefundView(refund.getRefundId(), refund.getAmount(),
                refund.getRefundMethod(), refund.getReason().name(), refund.getStatus().name(),
                refund.getNotes() == null ? "" : refund.getNotes(), refund.getRefundedAt(), operatorName);
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
