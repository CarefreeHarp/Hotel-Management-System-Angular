package com.example.demo.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Data
@Entity
@Table(name = "room_type")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "rooms")
public class RoomType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_type_id")
    // Identificador del tipo de habitación. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer roomTypeId;
    @Column(nullable = false, unique = true, length = 50)
    @NotBlank(message = "Enter the room type name.")
    @Size(max = 50, message = "The name cannot exceed 50 characters.")
    // Nombre del registro. Restricciones: Obligatorio; máximo 50 caracteres; único sin distinguir mayúsculas.
    private String name;
    @Column(nullable = false, length = 500)
    @NotBlank(message = "Enter a description.")
    @Size(max = 500, message = "The description cannot exceed 500 characters.")
    // Descripción detallada. Restricciones: Obligatoria; máximo 500 caracteres.
    private String description;
    @Column(name = "nightly_price", nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Enter the price per night.")
    @Positive(message = "The price per night must be greater than zero.")
    @Digits(integer = 8, fraction = 2, message = "Enter a price of up to 99,999,999.99 with at most two decimals.")
    // Tarifa por noche. Restricciones: Obligatoria; mayor que cero; decimal de precisión 10 y escala 2.
    private BigDecimal nightlyPrice;
    @Column(name = "max_capacity", nullable = false)
    @NotNull(message = "Enter the maximum capacity.")
    @Min(value = 1, message = "The capacity must be at least 1 guest.")
    @Max(value = 10, message = "The capacity cannot exceed 10 guests.")
    // Capacidad máxima de huéspedes. Restricciones: Obligatoria; entero de 1 a 10.
    private Integer maxCapacity;
    @Column(name = "main_photo", nullable = false, length = 500)
    @NotBlank(message = "Enter the main photo URL.")
    @Size(max = 500, message = "The photo URL cannot exceed 500 characters.")
    @Pattern(regexp = "(https?://\\S+)?", message = "Enter a photo URL that starts with http:// or https://.")
    // URL obligatoria de la imagen principal del tipo. Restricciones: Obligatoria; dirección http o https de máximo 500 caracteres.
    private String mainPhoto;
    @ElementCollection
    @OnDelete(action = OnDeleteAction.CASCADE)
    @CollectionTable(name = "room_type_secondary_photo", joinColumns = @JoinColumn(name = "room_type_id"))
    @Column(name = "photo_url", nullable = false, length = 500)
    @Size(max = 10, message = "Add at most 10 additional photos.")
    @Builder.Default
    // Lista de imágenes secundarias. Restricciones: Opcional; máximo 10; cada una es una dirección http o https de máximo 500 caracteres.
    private List<
            @Size(max = 500, message = "The photo URL cannot exceed 500 characters.")
            @Pattern(regexp = "(https?://\\S+)?", message = "Enter a photo URL that starts with http:// or https://.")
            String> secondaryPhotos = new ArrayList<>();
    @OneToMany(mappedBy = "roomType")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Habitaciones de este tipo. Restricciones: Lado inverso de Room.roomType; no se envía en el JSON para evitar la recursión tipo → habitación → tipo.
    private List<Room> rooms = new ArrayList<>();

}
