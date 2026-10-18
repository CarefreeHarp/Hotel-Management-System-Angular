package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import com.example.demo.entities.enums.PaymentStatus;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"folio", "operator"})
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    // Identificador del pago: clave primaria autogenerada.
    private Integer paymentId;
    @ManyToOne(optional = false)
    @JoinColumn(name = "folio_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    // Folio obligatorio al que se aplica el pago aprobado.
    private Folio folio;
    @ManyToOne
    @JoinColumn(name = "operator_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    // Operador opcional; null indica pago de autoservicio del cliente.
    private Operator operator;
    @Column(nullable = false, precision = 10, scale = 2)
    // Importe obligatorio decimal(10,2); el pago inicial exige mínimo COP 100.000 y como máximo el total de la reserva.
    private BigDecimal amount;
    @Column(name = "payment_method", nullable = false, length = 30)
    // Método obligatorio de hasta 30 caracteres; el pago inicial usa CARD.
    private String paymentMethod;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado obligatorio de hasta 20 caracteres; el pago simulado se registra APPROVED.
    private PaymentStatus status;
    @Column(name = "paid_at", nullable = false)
    // Fecha del pago obligatoria, asignada al confirmar.
    private LocalDateTime paidAt;

    // Titular recibido solo al confirmar; no se persiste ni se devuelve en el detalle.
    @Transient
    private String cardholderName;
    // Número de tarjeta del pago simulado; no se persiste.
    @Transient
    private String cardNumber;
    // Vencimiento del pago simulado; no se persiste.
    @Transient
    private String expiryDate;
    // Código de seguridad del pago simulado; no se persiste.
    @Transient
    private String securityCode;
}
