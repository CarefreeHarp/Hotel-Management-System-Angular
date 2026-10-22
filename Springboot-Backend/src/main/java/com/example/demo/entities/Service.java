package com.example.demo.entities;

import com.example.demo.entities.enums.ActivationStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

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
    // Identificador del servicio. Restricciones: Clave primaria única y autogenerada. Se conserva el identificador de la ruta al actualizar.
    private Integer serviceId;
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Enter the service name.")
    @Size(max = 100, message = "The name cannot exceed 100 characters.")
    // Nombre del registro. Restricciones: Obligatorio. Máximo 100 caracteres.
    private String name;
    @Column(name = "url_name", nullable = false, unique = true, length = 100)
    @NotBlank(message = "The service needs a URL name.")
    @Size(max = 100, message = "The URL name cannot exceed 100 characters.")
    // Nombre único apto para URL, generado a partir del nombre. Restricciones: Obligatorio. Máximo 100 caracteres. Único.
    private String urlName;
    @Lob
    @Column(nullable = false)
    @NotBlank(message = "Enter a description.")
    @Size(max = 5000, message = "The description cannot exceed 5,000 characters.")
    // Descripción detallada. Restricciones: Obligatoria. Máximo 5.000 caracteres.
    private String description;
    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Enter the price.")
    @PositiveOrZero(message = "The price cannot be negative.")
    @Digits(integer = 8, fraction = 2, message = "Enter a price of up to 99,999,999.99 with at most two decimals.")
    // Precio del servicio. Restricciones: Obligatorio. Cero o mayor. Decimal de precisión 10 y escala 2.
    private BigDecimal price;
    @Column(nullable = false, length = 50)
    @NotBlank(message = "Enter the category.")
    @Size(max = 50, message = "The category cannot exceed 50 characters.")
    // Categoría del servicio. Restricciones: Obligatoria. Máximo 50 caracteres.
    private String category;
    @Enumerated(EnumType.STRING)
    @Column(name = "activation_status", nullable = false, length = 8)
    @NotNull(message = "Select the activation status.")
    @Builder.Default
    // Disponibilidad para nuevas reservas. Restricciones: Obligatoria. Enum ACTIVE o INACTIVE. Editable en formulario y mediante Activate/Deactivate, sin alterar reservas existentes.
    private ActivationStatus activationStatus = ActivationStatus.ACTIVE;
    @Column(length = 255)
    @Size(max = 255, message = "The summary cannot exceed 255 characters.")
    // Resumen corto opcional. Restricciones: Opcional. Máximo 255 caracteres.
    private String summary;
    @Column(length = 50)
    @Size(max = 50, message = "The duration cannot exceed 50 characters.")
    // Duración opcional del servicio. Restricciones: Opcional. Máximo 50 caracteres.
    private String duration;
    @Column(length = 100)
    @Size(max = 100, message = "The schedule cannot exceed 100 characters.")
    // Información opcional de disponibilidad. Restricciones: Opcional. Máximo 100 caracteres.
    private String availability;
    @Column(length = 100)
    @Size(max = 100, message = "The location cannot exceed 100 characters.")
    // Ubicación opcional del servicio. Restricciones: Opcional. Máximo 100 caracteres.
    private String location;
    @Column(nullable = false, name = "main_image_url", length = 500)
    @NotBlank(message = "Enter the main photo URL.")
    @Size(max = 500, message = "The photo URL cannot exceed 500 characters.")
    @Pattern(regexp = "(https?://\\S+)?", message = "Enter a photo URL that starts with http:// or https://.")
    // URL de la imagen principal del servicio. Restricciones: Obligatoria. Dirección http o https de máximo 500 caracteres.
    private String mainImageUrl;
    @ElementCollection
    @CollectionTable(name = "service_secondary_image", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "image_url", nullable = false, length = 500)
    @Size(max = 10, message = "Add at most 10 additional photos.")
    @Builder.Default
    // Lista de imágenes secundarias. Restricciones: Opcional. Máximo 10. Cada una es una dirección http o https de máximo 500 caracteres.
    private List<@Size(max = 500, message = "The photo URL cannot exceed 500 characters.") @Pattern(regexp = "(https?://\\S+)?", message = "Enter a photo URL that starts with http:// or https://.") String> secondaryImageUrls = new ArrayList<>();
}
