package com.example.demo.entities;

import com.example.demo.validation.OnCreate;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "administrator")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "operators")
public class Administrator {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "admin_id")
    // Identificador del administrador. Restricciones: Clave primaria única y autogenerada; se conserva el identificador de la ruta al actualizar.
    private Integer adminId;
    @Column(nullable = false, length = 60)
    @NotBlank(message = "Enter the administrator's name.")
    @Size(max = 60, message = "The name cannot exceed 60 characters.")
    // Nombre del registro. Restricciones: Obligatorio; máximo 60 caracteres.
    private String name;
    @Column(nullable = false, unique = true, length = 100)
    @NotBlank(message = "Enter the email address.")
    @Size(max = 100, message = "The email address cannot exceed 100 characters.")
    @Email(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = "Enter a valid email address, for example name@atlansuites.com.")
    // Correo electrónico de contacto e inicio de sesión. Restricciones: Obligatorio; formato de correo; máximo 100 caracteres; único entre administradores y operarios.
    private String email;
    @Column(nullable = false, length = 255)
    @NotBlank(groups = OnCreate.class, message = "Enter a password.")
    @Size(min = 8, max = 255, groups = OnCreate.class, message = "The password must have between 8 and 255 characters.")
    // Contraseña de la cuenta. Restricciones: Obligatoria al crear, entre 8 y 255 caracteres; se conserva al actualizar.
    private String password;
    @OneToMany(mappedBy = "admin")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Operarios a cargo del administrador. Restricciones: Lado inverso de Operator.admin; no se envía en el JSON para evitar la recursión administrador → operario → administrador.
    private List<Operator> operators = new ArrayList<>();

}
