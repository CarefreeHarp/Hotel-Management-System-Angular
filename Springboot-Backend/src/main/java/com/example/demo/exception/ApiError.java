package com.example.demo.exception;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Cuerpo JSON de todas las respuestas de error. Conserva los atributos del error
 * por defecto de Spring (timestamp, status, error, message y path) y agrega
 * fieldErrors: el mensaje de cada campo rechazado, para mostrarlo bajo ese campo.
 * fieldErrors no se envía cuando el error no es de un campo concreto.
 */
public record ApiError(LocalDateTime timestamp, int status, String error, String message, String path,
        Map<String, String> fieldErrors) {
}
