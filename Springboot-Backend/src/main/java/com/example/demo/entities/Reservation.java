package com.example.demo.entities;

import com.example.demo.entities.enums.ReservationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Entity
@Table(name = "reservation")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "client", "room", "services" })
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    // Identificador de la reserva. Restricciones: Clave primaria única y autogenerada.
    private Integer reservationId;
    @Column(name = "reservation_code", nullable = false, unique = true, length = 30)
    // Código único de la reserva. Restricciones: No admite null en la base de datos. Valor único. Columna de máximo 30 caracteres.
    private String reservationCode;
    @Column(name = "check_in_date", nullable = false)
    @NotNull(message = "Choose a check-in date.")
    // Fecha programada de llegada. Restricciones: Obligatoria. Al reservar no puede ser pasada ni estar a más de dos años.
    private LocalDate checkInDate;
    @Column(name = "check_out_date", nullable = false)
    @NotNull(message = "Choose a check-out date.")
    // Fecha programada de salida. Restricciones: Obligatoria. Posterior a la llegada. Estancia de máximo 90 noches.
    private LocalDate checkOutDate;
    @Column(name = "guest_count", nullable = false)
    @NotNull(message = "Enter the number of guests.")
    @Min(value = 1, message = "Enter at least one guest.")
    // Cantidad de huéspedes de la reserva. Restricciones: Obligatoria. Al menos 1 y sin superar la capacidad del tipo de habitación.
    private Integer guestCount;
    @Column(name = "nightly_price", nullable = false, precision = 10, scale = 2)
    // Tarifa acordada por noche. Restricciones: No admite null en la base de datos. Columna decimal de precisión 10 y escala 2.
    private BigDecimal nightlyPrice;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado actual de la reserva. Restricciones: No admite null en la base de datos. Enum PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT o CANCELLED.
    private ReservationStatus status;
    @Column(name = "created_at", nullable = false)
    // Fecha y hora de creación. Restricciones: No admite null en la base de datos.
    private LocalDateTime createdAt;
    @ManyToOne
    @JoinColumn(name = "client_id")
    // Cliente que realizó la reserva. Restricciones: Se recibe clientId en el flujo. Las respuestas usan DTO. Admite null: al borrar el cliente la reserva queda sin cliente.
    private Client client;
    @ManyToOne
    @JoinColumn(name = "room_id")
    // Habitación asignada. Restricciones: El flujo recibe roomType.roomTypeId y el backend asigna una habitación. Las respuestas usan DTO. Una habitación con reservas no se borra, se puede desactivar.
    private Room room;
    @ManyToMany
    @JoinTable(name = "reservation_service", joinColumns = @JoinColumn(name = "reservation_id"), inverseJoinColumns = @JoinColumn(name = "service_id"))
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Servicios contratados con la reserva. Restricciones: El flujo recibe serviceId. Las respuestas usan DTO. Un servicio con reservas no se borra, se desactiva.
    private List<Service> services = new ArrayList<>();

    @Transient
    // Pago inicial opcional del flujo de reserva. Solo entrada, no es una columna.
    private Payment initialPayment;
}
