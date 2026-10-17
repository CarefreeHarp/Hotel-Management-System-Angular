package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "folio_item")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"folio", "service"})
public class FolioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folio_item_id")
    // Identificador del cargo: clave primaria autogenerada.
    private Integer itemId;
    @ManyToOne(optional = false)
    @JoinColumn(name = "folio_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    // Folio obligatorio; el cargo se genera con la reserva.
    private Folio folio;
    @ManyToOne
    @JoinColumn(name = "service_id")
    // Servicio opcional asociado al cargo; el precio y concepto se guardan como copia.
    private Service service;
    @Column(nullable = false, length = 150)
    // Concepto obligatorio de hasta 150 caracteres; conserva el nombre contratado.
    private String concept;
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    // Precio unitario obligatorio decimal(10,2); no cambia al editar el catálogo.
    private BigDecimal unitPrice;
    @Column(nullable = false)
    // Cantidad obligatoria; la selección de servicios crea una unidad por servicio.
    private Integer quantity;
    @Column(name = "charged_at", nullable = false)
    // Fecha del cargo obligatoria, asignada al reservar.
    private LocalDateTime chargedAt;

}
