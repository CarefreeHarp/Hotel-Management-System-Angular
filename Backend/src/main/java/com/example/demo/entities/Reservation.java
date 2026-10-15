package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import com.example.demo.entities.enums.ReservationStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "reservation")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"client", "room", "services"})
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    // Identificador de la reserva. Restricciones: Clave primaria única y autogenerada.
    private Integer reservationId;
    @Column(name = "reservation_code", nullable = false, unique = true, length = 30)
    // Código único de la reserva. Restricciones: No admite null en la base de datos; valor único; columna de máximo 30 caracteres.
    private String reservationCode;
    @Column(name = "check_in_date", nullable = false)
    // Fecha programada de llegada. Restricciones: No admite null en la base de datos.
    private LocalDate checkInDate;
    @Column(name = "check_out_date", nullable = false)
    // Fecha programada de salida. Restricciones: No admite null en la base de datos.
    private LocalDate checkOutDate;
    @Column(name = "guest_count", nullable = false)
    // Cantidad de huéspedes de la reserva. Restricciones: No admite null en la base de datos.
    private Integer guestCount;
    @Column(name = "nightly_price", nullable = false, precision = 10, scale = 2)
    // Tarifa acordada por noche. Restricciones: No admite null en la base de datos; columna decimal de precisión 10 y escala 2.
    private BigDecimal nightlyPrice;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado actual de la reserva. Restricciones: No admite null en la base de datos; enum PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT o CANCELLED.
    private ReservationStatus status;
    @Column(name = "created_at", nullable = false)
    // Fecha y hora de creación. Restricciones: No admite null en la base de datos.
    private LocalDateTime createdAt;
    @ManyToOne
    @JoinColumn(name = "client_id")
    @JsonIgnore
    // Cliente que realizó la reserva. Restricciones: No se envía en el JSON: las reservas se consultan por cliente, que ya se tiene; admite null: al borrar el cliente la reserva queda sin cliente.
    private Client client;
    @ManyToOne
    @JoinColumn(name = "room_id")
    @JsonIgnore
    // Habitación asignada. Restricciones: No se envía en el JSON: el perfil recibe solo su número y el nombre de su tipo en ReservationDTO; una habitación con reservas no se borra, se puede desactivar.
    private Room room;
    @ManyToMany
    @JoinTable(name = "reservation_service",
            joinColumns = @JoinColumn(name = "reservation_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id"))
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Servicios contratados con la reserva. Restricciones: No se envía en el JSON; un servicio con reservas no se borra, se desactiva.
    private List<Service> services = new ArrayList<>();

}
