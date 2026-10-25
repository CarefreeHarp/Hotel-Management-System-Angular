package com.example.demo.entities;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Calificación de una estadía pasada, una por reserva. El cliente y el tipo de
 * habitación se obtienen de la reserva, así que la calificación se conserva aunque
 * el cliente borre su cuenta. Que la reserva esté CHECKED_OUT y sea del propio
 * cliente lo revisa el servicio al calificar.
 */
@Data
@Entity
@Table(name = "rating")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "reservation")
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    // Identificador de la calificación: clave primaria autogenerada.
    private Integer ratingId;
    @OneToOne(optional = false)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @NotNull(message = "Select the stay to rate.")
    // Reserva calificada, obligatoria y única: una estadía no se califica dos veces. Se borra con la reserva.
    private Reservation reservation;
    @Column(nullable = false)
    @NotNull(message = "Choose a score from 1 to 5.")
    @Min(value = 1, message = "The score must be between 1 and 5.")
    @Max(value = 5, message = "The score must be between 1 and 5.")
    // Estrellas de la estadía. Restricciones: Obligatorias. Entero de 1 a 5.
    private Integer score;
    @Column(length = 500)
    @Size(max = 500, message = "The comment cannot exceed 500 characters.")
    // Comentario opcional del cliente. Máximo 500 caracteres.
    private String comment;
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Enter the rating date.")
    // Fecha de la calificación obligatoria, asignada al calificar.
    private LocalDateTime createdAt;
}
