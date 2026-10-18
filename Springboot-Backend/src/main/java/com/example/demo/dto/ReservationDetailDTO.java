package com.example.demo.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public record ReservationDetailDTO(ReservationDTO reservation, Integer clientId, Integer roomFloor,
    Integer maxCapacity, LocalDateTime createdAt, BigDecimal nightlyPrice, long nights,
    Integer folioId, String folioStatus, LocalDateTime issuedAt, BigDecimal subtotal,
    BigDecimal total, BigDecimal paidTotal, BigDecimal balance, List<Charge> charges, List<PaymentView> payments, String roomTypeMainPhoto) {
    public record Charge(Integer itemId, String concept, Integer quantity, BigDecimal unitPrice,
        BigDecimal subtotal, LocalDateTime chargedAt) {}
    public record PaymentView(Integer paymentId, BigDecimal amount, String paymentMethod,
        String status, LocalDateTime paidAt, String operatorName) {}
}
