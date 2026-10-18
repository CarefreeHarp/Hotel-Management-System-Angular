package com.example.demo.entities;

import jakarta.persistence.*;
import com.example.demo.entities.enums.ActivationStatus;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;
import com.example.demo.entities.enums.RoomStatus;

@Data
@Entity
@Table(name = "room")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"roomType", "reservations"})
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    // Identificador interno de la habitación. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer roomId;
    @Column(name = "room_number", nullable = false, unique = true)
    // Número físico único de la habitación. Restricciones: No admite null en la base de datos; valor único en la base de datos.
    private Integer number;
    @Column(nullable = false)
    // Piso donde se ubica la habitación. Restricciones: No admite null en la base de datos.
    private Integer floor;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    // Estado actual del registro. Restricciones: No admite null en la base de datos; columna de máximo 20 caracteres; enum AVAILABLE, OCCUPIED o MAINTENANCE.
    private RoomStatus status;
    @ManyToOne(optional = false)
    @JoinColumn(name = "room_type_id", nullable = false)
    // Tipo de habitación asignado. Restricciones: Relación obligatoria con un registro existente; los campos adicionales recibidos no modifican ese registro.
    private RoomType roomType;
    @Enumerated(EnumType.STRING)
    @Column(name = "activation_status", nullable = false, length = 8)
    @Builder.Default
    // Disponibilidad para nuevas reservas. Restricciones: No admite null; enum ACTIVE o INACTIVE; editable en formulario y mediante Activate/Deactivate, sin alterar reservas existentes.
    private ActivationStatus activationStatus = ActivationStatus.ACTIVE;
    @OneToMany(mappedBy = "room")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Reservas de la habitación. Restricciones: Lado inverso de Reservation.room; no se envía en el JSON para evitar la recursión habitación → reserva → habitación.
    private List<Reservation> reservations = new ArrayList<>();

}
