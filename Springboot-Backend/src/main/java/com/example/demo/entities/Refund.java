package com.example.demo.entities;

import java.time.LocalDateTime;
import com.example.demo.entities.enums.PaymentStatus;
import com.example.demo.entities.enums.RefundReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Dinero que el hotel le devuelve al cliente al cancelar una reserva o al bajar su
 * total por debajo de lo pagado. Es un pago en sentido contrario y no modifica
 * PAYMENT: el pagado neto de un folio son sus pagos aprobados menos sus reembolsos
 * aprobados.
 */
@Data
@Entity
@Table(name = "refund")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "folio", "operator" })
public class Refund {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    // Identificador del reembolso: clave primaria autogenerada.
    private Integer refundId;
    @ManyToOne(optional = false)
    @JoinColumn(name = "folio_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @NotNull(message = "Select the folio to refund.")
    // Folio obligatorio del que sale el dinero, igual que en PAYMENT. Se borra con el folio.
    private Folio folio;
    @ManyToOne
    @JoinColumn(name = "operator_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    // Operador opcional que procesó el reembolso. null indica que lo pidió el cliente.
    private Operator operator;
    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Enter the refund amount.")
    @DecimalMin(value = "0.01", message = "The refund amount must be greater than zero.")
    @Digits(integer = 8, fraction = 2, message = "Enter an amount of up to 99,999,999.99 with at most two decimals.")
    // Importe devuelto. Restricciones: Obligatorio. Mayor que cero. Decimal de precisión 10 y escala 2.
    private BigDecimal amount;
    @Column(name = "refund_method", nullable = false, length = 30)
    @NotBlank(message = "Choose how the money is returned.")
    @Pattern(regexp = "CARD|CASH", message = "The refund method must be CARD or CASH.")
    // Por dónde vuelve el dinero: CARD a la tarjeta o CASH en efectivo en recepción.
    private String refundMethod;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Choose the refund reason.")
    // CANCELLATION si se canceló la reserva; MODIFICATION si su total quedó por debajo de lo pagado.
    private RefundReason reason;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Choose the refund status.")
    // Mismos estados que PAYMENT. El reembolso simulado se registra APPROVED.
    private PaymentStatus status;
    @Column(length = 255)
    @Size(max = 255, message = "The notes cannot exceed 255 characters.")
    // Detalle opcional, por ejemplo el total anterior y el nuevo.
    private String notes;
    @Column(name = "refunded_at", nullable = false)
    @NotNull(message = "Enter the refund date.")
    // Fecha del reembolso obligatoria, asignada al registrarlo.
    private LocalDateTime refundedAt;
}
