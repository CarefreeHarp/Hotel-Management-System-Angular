package com.example.demo.entities;

import jakarta.persistence.*;
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
    // Nombre del registro. Restricciones: No admite null en la base de datos; columna de máximo 60 caracteres.
    private String name;
    @Column(nullable = false, unique = true, length = 100)
    // Correo electrónico único de contacto e inicio de sesión. Restricciones: No admite null en la base de datos; valor único en la base de datos; columna de máximo 100 caracteres.
    private String email;
    @Column(nullable = false, length = 255)
    // Contraseña de la cuenta. Restricciones: No admite null en la base de datos; columna de máximo 255 caracteres; se conserva al actualizar y se incluye en JSON.
    private String password;
    @OneToMany(mappedBy = "admin")
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    @Builder.Default
    // Operarios a cargo del administrador. Restricciones: Lado inverso de Operator.admin; no se envía en el JSON para evitar la recursión administrador → operario → administrador.
    private List<Operator> operators = new ArrayList<>();

}
