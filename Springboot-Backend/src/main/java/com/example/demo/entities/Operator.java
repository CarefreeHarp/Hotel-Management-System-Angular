package com.example.demo.entities;

import com.example.demo.validation.OnCreate;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Entity
@Table(name = "operator")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "admin")
public class Operator {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "operator_id")
    // Identificador del operario. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer operatorId;
    @Column(nullable = false, length = 60)
    @NotBlank(message = "Enter the operator's first name.")
    @Size(max = 60, message = "The first name cannot exceed 60 characters.")
    // Nombre del registro. Restricciones: Obligatorio; máximo 60 caracteres.
    private String name;
    @Column(nullable = false, length = 60)
    @NotBlank(message = "Enter the operator's last name.")
    @Size(max = 60, message = "The last name cannot exceed 60 characters.")
    // Apellido de la persona. Restricciones: Obligatorio; máximo 60 caracteres.
    private String lastName;
    @Column(nullable = false, unique = true, length = 100)
    @NotBlank(message = "Enter the email address.")
    @Size(max = 100, message = "The email address cannot exceed 100 characters.")
    @Email(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = "Enter a valid email address, for example name@atlansuites.com.")
    // Correo electrónico de contacto e inicio de sesión. Restricciones: Obligatorio; formato de correo; máximo 100 caracteres; único entre operarios y administradores.
    private String email;
    @Column(nullable = false, length = 255)
    @NotBlank(groups = OnCreate.class, message = "Enter a password.")
    @Size(min = 8, max = 255, groups = OnCreate.class, message = "The password must have between 8 and 255 characters.")
    // Contraseña de la cuenta. Restricciones: Obligatoria al crear, entre 8 y 255 caracteres; se conserva al actualizar.
    private String password;
    @ManyToOne(optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    @NotNull(message = "Select the administrator in charge of this operator.")
    // Administrador responsable del operario. Restricciones: Obligatorio; admin.adminId debe ser un administrador existente; los campos adicionales recibidos no modifican ese registro.
    private Administrator admin;

}
