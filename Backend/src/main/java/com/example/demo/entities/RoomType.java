package com.example.demo.entities;

import jakarta.persistence.*;
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
    // Nombre del registro. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 50 caracteres.
    private String name;
    @Column(nullable = false, length = 500)
    // Descripción detallada. Restricciones: No admite null en la base de datos; columna de máximo 500 caracteres.
    private String description;
    @Column(name = "nightly_price", nullable = false, precision = 10, scale = 2)
    // Tarifa acordada por noche. Restricciones: No admite null en la base de datos; columna decimal de precisión 10 y escala 2.
    private BigDecimal nightlyPrice;
    @Column(name = "max_capacity", nullable = false)
    // Capacidad máxima de huéspedes. Restricciones: No admite null en la base de datos.
    private Integer maxCapacity;
    @Column(name = "main_photo", nullable = false, length = 500)
    // URL obligatoria de la imagen principal del tipo. Restricciones: No admite null en la base de datos; columna de máximo 500 caracteres.
    private String mainPhoto;
    @ElementCollection
    @OnDelete(action = OnDeleteAction.CASCADE)
    @CollectionTable(name = "room_type_secondary_photo", joinColumns = @JoinColumn(name = "room_type_id"))
    @Column(name = "photo_url", nullable = false, length = 500)
    @Builder.Default
    // Lista de imágenes secundarias. Restricciones: Colección opcional; cada elemento no admite null y su columna tiene un máximo de 500 caracteres.
    private List<String> secondaryPhotos = new ArrayList<>();
    @OneToMany(mappedBy = "roomType")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Habitaciones de este tipo. Restricciones: Lado inverso de Room.roomType; no se envía en el JSON para evitar la recursión tipo → habitación → tipo.
    private List<Room> rooms = new ArrayList<>();

}
