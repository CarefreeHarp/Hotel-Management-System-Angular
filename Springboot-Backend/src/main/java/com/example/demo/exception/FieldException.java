package com.example.demo.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Error de negocio ligado a uno o varios campos del formulario: un correo ya
 * registrado, un tipo de habitación que no existe o un número de tarjeta inválido.
 * La respuesta lleva el mensaje de cada campo en fieldErrors y el frontend lo
 * muestra bajo el campo correspondiente.
 */
public class FieldException extends ResponseStatusException {

    private final LinkedHashMap<String, String> fieldErrors;

    public FieldException(HttpStatus status, String field, String message) {
        this(status, Map.of(field, message));
    }

    public FieldException(HttpStatus status, Map<String, String> fieldErrors) {
        super(status, String.join(" ", fieldErrors.values()));
        this.fieldErrors = new LinkedHashMap<>(fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
