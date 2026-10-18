package com.example.demo.validation;

import jakarta.validation.groups.Default;

/**
 * Grupo de Bean Validation para las reglas que solo aplican al crear, como la
 * contraseña: al editar, el backend conserva la guardada. Extiende Default, así
 * que @Validated(OnCreate.class) también revisa las demás reglas de la entidad.
 */
public interface OnCreate extends Default {
}
