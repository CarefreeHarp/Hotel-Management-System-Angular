package com.example.demo.entities;

import jakarta.persistence.*;
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
    // Nombre del registro. Restricciones: No admite null en la base de datos; columna de máximo 60 caracteres.
    private String name;
    @Column(nullable = false, length = 60)
    // Apellido de la persona. Restricciones: No admite null en la base de datos; columna de máximo 60 caracteres.
    private String lastName;
    @Column(nullable = false, unique = true, length = 100)
    // Correo electrónico único de contacto e inicio de sesión. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 100 caracteres.
    private String email;
    @Column(nullable = false, length = 255)
    // Contraseña de la cuenta. Restricciones: No admite null en la base de datos; columna de máximo 255 caracteres; se conserva al actualizar y se incluye en JSON.
    private String password;
    @ManyToOne(optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    // Administrador responsable del operario. Restricciones: Relación obligatoria con un registro existente; los campos adicionales recibidos no modifican ese registro.
    private Administrator admin;

}
