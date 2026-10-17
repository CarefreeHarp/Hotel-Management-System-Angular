package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import com.example.demo.entities.enums.FolioStatus;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.time.LocalDateTime;

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
    // Reserva obligatoria y única por folio; se conserva durante el historial.
    private Reservation reservation;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado obligatorio PENDING o PAID; lo determina el pago inicial.
    private FolioStatus status;
    @Column(name = "issued_at", nullable = false)
    // Fecha de emisión obligatoria, asignada al crear el folio.
    private LocalDateTime issuedAt;

}
