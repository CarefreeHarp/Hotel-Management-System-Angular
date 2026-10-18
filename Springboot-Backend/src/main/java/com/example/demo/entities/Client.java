package com.example.demo.entities;

import com.example.demo.validation.OnCreate;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "client")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "reservations")
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "client_id")
    // Identificador autogenerado y autoincremental del cliente. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer clientId;
    @Column(nullable = false, length = 60)
    @NotBlank(message = "Enter the first name.")
    @Size(max = 60, message = "The first name cannot exceed 60 characters.")
    // Nombre del registro. Restricciones: Obligatorio; máximo 60 caracteres.
    private String name;
    @Column(nullable = false, length = 60)
    @NotBlank(message = "Enter the last name.")
    @Size(max = 60, message = "The last name cannot exceed 60 characters.")
    // Apellido de la persona. Restricciones: Obligatorio; máximo 60 caracteres.
    private String lastName;
    @Column(nullable = false, unique = true, length = 20)
    @NotBlank(message = "Enter the national ID.")
    @Pattern(regexp = "([\\p{L}0-9]{5,20})?", message = "The national ID must have 5 to 20 letters or numbers, without spaces or symbols.")
    // Documento de identidad del cliente. Restricciones: Obligatorio; entre 5 y 20 letras (con tildes y ñ) o números; único.
    private String nationalId;
    @Column(nullable = false, length = 20)
    @NotBlank(message = "Enter the phone number.")
    @Pattern(regexp = "(\\+?[0-9]{7,15})?", message = "Enter a phone number with 7 to 15 digits, without spaces; it may start with +.")
    // Teléfono de contacto. Restricciones: Obligatorio; entre 7 y 15 dígitos, con + opcional al inicio.
    private String phone;
    @Column(nullable = false, unique = true, length = 100)
    @NotBlank(message = "Enter the email address.")
    @Size(max = 100, message = "The email address cannot exceed 100 characters.")
    @Email(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = "Enter a valid email address, for example name@example.com.")
    // Correo electrónico de contacto e inicio de sesión. Restricciones: Obligatorio; formato de correo; máximo 100 caracteres; único.
    private String email;
    @Column(nullable = false, length = 255)
    @NotBlank(groups = OnCreate.class, message = "Enter a password.")
    @Size(min = 8, max = 255, groups = OnCreate.class, message = "The password must have between 8 and 255 characters.")
    // Contraseña de la cuenta. Restricciones: Obligatoria al crear, entre 8 y 255 caracteres; se conserva al actualizar.
    private String password;
    @Column(name = "profile_photo", length = 500)
    @Size(max = 500, message = "The photo URL cannot exceed 500 characters.")
    @Pattern(regexp = "(https?://\\S+)?", message = "Enter a photo URL that starts with http:// or https://.")
    // URL opcional de la foto de perfil. Restricciones: Opcional; dirección http o https de máximo 500 caracteres.
    private String profilePhoto;
    @OneToMany(mappedBy = "client")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Reservas hechas por el cliente. Restricciones: Lado inverso de Reservation.client; no se envía en el JSON: se piden aparte con GET /reservations?clientId=; al borrar el cliente sus reservas quedan con client_id en null.
    private List<Reservation> reservations = new ArrayList<>();

}
