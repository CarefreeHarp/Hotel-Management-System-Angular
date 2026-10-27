package com.example.demo.entities;

import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.RoomStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
@Table(name = "room")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "roomType", "reservations" })
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    // Identificador interno de la habitación. Restricciones: Clave primaria única y autogenerada. Se conserva el id de la ruta al editar.
    private Integer roomId;
    @Column(name = "room_number", nullable = false, unique = true)
    @NotNull(message = "Enter the room number.")
    @Min(value = 1, message = "The room number must be at least 1.")
    @Max(value = 9999, message = "The room number cannot exceed 9999.")
    // Número físico de la habitación. Restricciones: Obligatorio. Entero de 1 a 9999. Único.
    private Integer number;
    @Column(nullable = false)
    @NotNull(message = "Enter the floor.")
    @Min(value = 0, message = "The floor cannot be negative.")
    @Max(value = 200, message = "The floor cannot exceed 200.")
    // Piso donde se ubica la habitación. Restricciones: Obligatorio. Entero de 0 a 200.
    private Integer floor;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Select the room status.")
    // Estado actual del registro. Restricciones: Obligatorio. Enum AVAILABLE, OCCUPIED, CLEANING o MAINTENANCE.
    private RoomStatus status;
    @ManyToOne(optional = false)
    @JoinColumn(name = "room_type_id", nullable = false)
    @NotNull(message = "Select a room type.")
    // Tipo de habitación asignado. Restricciones: Obligatorio. roomType.roomTypeId debe ser un tipo existente. Los campos adicionales recibidos no modifican ese registro.
    private RoomType roomType;
    @Enumerated(EnumType.STRING)
    @Column(name = "activation_status", nullable = false, length = 8)
    @NotNull(message = "Select the activation status.")
    @Builder.Default
    // Disponibilidad para nuevas reservas. Restricciones: Obligatoria. Enum ACTIVE o INACTIVE. Editable en formulario y mediante Activate/Deactivate, sin alterar reservas existentes.
    private ActivationStatus activationStatus = ActivationStatus.ACTIVE;
    @OneToMany(mappedBy = "room")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Reservas de la habitación. Restricciones: Lado inverso de Reservation.room. No se envía en el JSON para evitar la recursión habitación → reserva → habitación.
    private List<Reservation> reservations = new ArrayList<>();

}
