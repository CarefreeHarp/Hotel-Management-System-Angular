package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "service")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    // Identificador del servicio. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer serviceId;
    @Column(nullable = false, length = 100)
    // Nombre del registro. Restricciones: No admite null en la base de datos; columna de máximo 100 caracteres.
    private String name;
    @Column(name = "url_name", nullable = false, unique = true, length = 100)
    // Nombre único apto para URL. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 100 caracteres.
    private String urlName;
    @Lob
    @Column(nullable = false)
    // Descripción detallada. Restricciones: No admite null en la base de datos.
    private String description;
    @Column(nullable = false, precision = 10, scale = 2)
    // Precio del servicio. Restricciones: No admite null en la base de datos; columna decimal de precisión 10 y escala 2.
    private BigDecimal price;
    @Column(nullable = false, length = 50)
    // Categoría del servicio. Restricciones: No admite null en la base de datos; columna de máximo 50 caracteres.
    private String category;
    @Column(nullable = false)
    // Indica si el servicio sigue en el catálogo. Restricciones: No admite null en la base de datos; lo asigna el backend: true al crearlo y false al eliminar un servicio que tiene reservas.
    private Boolean active;
    @Column(length = 255)
    // Resumen corto opcional. Restricciones: Opcional; columna de máximo 255 caracteres.
    private String summary;
    @Column(length = 50)
    // Duración opcional del servicio. Restricciones: Opcional; columna de máximo 50 caracteres.
    private String duration;
    @Column(length = 100)
    // Información opcional de disponibilidad. Restricciones: Opcional; columna de máximo 100 caracteres.
    private String availability;
    @Column(length = 100)
    // Ubicación opcional del servicio. Restricciones: Opcional; columna de máximo 100 caracteres.
    private String location;
    @Column(nullable = false, name = "main_image_url", length = 500)
    // URL de la imagen principal del servicio. Restricciones: No admite null en la base de datos; columna de máximo 500 caracteres.
    private String mainImageUrl;
    @ElementCollection
    @CollectionTable(name = "service_secondary_image", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "image_url", nullable = false, length = 500)
    @Builder.Default
    // Lista de imágenes secundarias. Restricciones: Colección opcional; cada elemento no admite null y su columna tiene un máximo de 500 caracteres.
    private List<String> secondaryImageUrls = new ArrayList<>();
}
