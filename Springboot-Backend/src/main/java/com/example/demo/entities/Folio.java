package com.example.demo.entities;

import java.time.LocalDateTime;
import com.example.demo.entities.enums.FolioStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Data
@Entity
@Table(name = "folio")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "reservation")
public class Folio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folio_id")
    // Identificador del folio: clave primaria autogenerada al reservar.
    private Integer folioId;
    @OneToOne(optional = false)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    // Reserva obligatoria y única por folio. Se conserva durante el historial.
    private Reservation reservation;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado obligatorio PENDING o PAID. Lo determina el pago inicial.
    private FolioStatus status;
    @Column(name = "issued_at", nullable = false)
    // Fecha de emisión obligatoria, asignada al crear el folio.
    private LocalDateTime issuedAt;

}
