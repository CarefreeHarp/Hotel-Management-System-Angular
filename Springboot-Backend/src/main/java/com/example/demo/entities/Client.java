package com.example.demo.entities;

import jakarta.persistence.*;
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
    // Nombre del registro. Restricciones: No admite null en la base de datos; columna de máximo 60 caracteres.
    private String name;
    @Column(nullable = false, length = 60)
    // Apellido de la persona. Restricciones: No admite null en la base de datos; columna de máximo 60 caracteres.
    private String lastName;
    @Column(nullable = false, unique = true, length = 20)
    // Documento de identidad del cliente. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 20 caracteres.
    private String nationalId;
    @Column(nullable = false, length = 20)
    // Teléfono de contacto. Restricciones: No admite null en la base de datos; columna de máximo 20 caracteres.
    private String phone;
    @Column(nullable = false, unique = true, length = 100)
    // Correo electrónico único de contacto e inicio de sesión. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 100 caracteres.
    private String email;
    @Column(nullable = false, length = 255)
    // Contraseña de la cuenta. Restricciones: No admite null en la base de datos; columna de máximo 255 caracteres; se conserva al actualizar y se incluye en JSON.
    private String password;
    @Column(name = "profile_photo", length = 500)
    // URL opcional de la foto de perfil. Restricciones: Opcional; columna de máximo 500 caracteres.
    private String profilePhoto;
    @OneToMany(mappedBy = "client")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Reservas hechas por el cliente. Restricciones: Lado inverso de Reservation.client; no se envía en el JSON: se piden aparte con GET /reservations?clientId=; al borrar el cliente sus reservas quedan con client_id en null.
    private List<Reservation> reservations = new ArrayList<>();

}
