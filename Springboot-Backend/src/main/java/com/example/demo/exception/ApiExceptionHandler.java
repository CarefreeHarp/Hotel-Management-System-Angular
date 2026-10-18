package com.example.demo.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import org.springframework.beans.TypeMismatchException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.JacksonException;

/**
 * Convierte cualquier error de la API en el mismo JSON (ApiError). Los errores de
 * validación y de negocio indican en fieldErrors el mensaje de cada campo; los
 * errores inesperados responden 500 sin detalles técnicos (ni SQL ni trazas) y el
 * detalle queda en el log del servidor.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final String UNEXPECTED = "An unexpected error occurred on the server. Please try again later.";

    /** Si un campo incumple varias reglas, se muestra primero la de campo obligatorio. */
    private static final Set<String> REQUIRED_RULES = Set.of("NotNull", "NotBlank", "NotEmpty");

    // @Valid y @Validated sobre @RequestBody: un mensaje por cada campo rechazado.
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        Object target = ex.getBindingResult().getTarget();
        List<String> order = target == null ? List.of()
                : Arrays.stream(target.getClass().getDeclaredFields()).map(Field::getName).toList();
        // Los mensajes se informan en el orden de los campos de la entidad, como en el formulario.
        ex.getBindingResult().getFieldErrors().stream()
                .sorted(Comparator.comparingInt(error -> declaredIndex(order, error.getField())))
                .forEach(error -> addFieldError(fields, error.getField(), error.getDefaultMessage(), error.getCode()));
        return respond(ex, HttpStatus.BAD_REQUEST, null, fields, headers, request);
    }

    // Reglas sobre parámetros de la URL, como el correo y la contraseña de los login.
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(result -> {
            for (MessageSourceResolvable error : result.getResolvableErrors()) {
                String field = error instanceof FieldError fieldError
                        ? fieldError.getField()
                        : result.getMethodParameter().getParameterName();
                addFieldError(fields, field, error.getDefaultMessage(), lastCode(error));
            }
        });
        return respond(ex, HttpStatus.BAD_REQUEST, null, fields, headers, request);
    }

    // Cuerpo que no es JSON o con un valor del tipo equivocado: un texto en un número, un estado inexistente...
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String field = jsonField(ex);
        if (field == null) {
            return respond(ex, HttpStatus.BAD_REQUEST, "The request body is missing or is not valid JSON.",
                    Map.of(), headers, request);
        }
        return respond(ex, HttpStatus.BAD_REQUEST, "The field \"" + field + "\" has an invalid value.",
                Map.of(field, "Enter a valid value."), headers, request);
    }

    // Parámetro con el tipo equivocado, por ejemplo /rooms/abc o una fecha imposible.
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        String name = ex.getPropertyName() == null ? "value" : ex.getPropertyName();
        return respond(ex, HttpStatus.BAD_REQUEST, "The value \"" + ex.getValue() + "\" is not valid for \"" + name + "\".",
                Map.of(name, "Enter a valid value."), headers, request);
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(MissingServletRequestParameterException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String name = ex.getParameterName();
        return respond(ex, HttpStatus.BAD_REQUEST, "The parameter \"" + name + "\" is required.",
                Map.of(name, "This value is required."), headers, request);
    }

    // Reglas de negocio de los servicios: correo repetido, tipo inexistente, tarjeta inválida...
    @ExceptionHandler(FieldException.class)
    public ResponseEntity<Object> handleFieldException(FieldException ex, WebRequest request) {
        return respond(ex, ex.getStatusCode(), ex.getReason(), ex.getFieldErrors(), new HttpHeaders(), request);
    }

    // Validación de Hibernate al guardar: la última capa antes de las restricciones de la base de datos.
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            // secondaryPhotos[0].<list element> se informa como secondaryPhotos[0].
            String field = violation.getPropertyPath().toString().replaceAll("\\.<[^>]+>", "");
            addFieldError(fields, field, violation.getMessage(),
                    violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName());
        }
        return respond(ex, HttpStatus.BAD_REQUEST, null, fields, new HttpHeaders(), request);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Object> handleNoSuchElement(NoSuchElementException ex, WebRequest request) {
        return respond(ex, HttpStatus.NOT_FOUND, "The requested record does not exist or was deleted.",
                Map.of(), new HttpHeaders(), request);
    }

    // Restricción de la base de datos (valor único o llave foránea) que ninguna capa anterior detectó.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrity(DataIntegrityViolationException ex, WebRequest request) {
        logger.warn("Data integrity violation on " + path(request), ex);
        return respond(ex, HttpStatus.CONFLICT,
                "The change conflicts with existing records: a value may already be registered or the record may still be in use.",
                Map.of(), new HttpHeaders(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        // Al confirmar la transacción, Spring envuelve los errores de validación y de integridad.
        ConstraintViolationException violation = findCause(ex, ConstraintViolationException.class);
        if (violation != null) return handleConstraintViolation(violation, request);
        DataIntegrityViolationException integrity = findCause(ex, DataIntegrityViolationException.class);
        if (integrity != null) return handleDataIntegrity(integrity, request);
        logger.error("Unexpected error on " + path(request), ex);
        return respond(ex, HttpStatus.INTERNAL_SERVER_ERROR, UNEXPECTED, Map.of(), new HttpHeaders(), request);
    }

    /**
     * Las demás excepciones de Spring (ResponseStatusException, rutas inexistentes,
     * métodos no permitidos...) llegan aquí con un ProblemDetail; se convierte en ApiError.
     */
    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        if (!(body instanceof ApiError)) {
            String detail = body instanceof ProblemDetail problem ? problem.getDetail() : null;
            body = apiError(statusCode, statusCode.is5xxServerError() ? UNEXPECTED : detail, Map.of(), request);
        }
        return new ResponseEntity<>(body, headers, statusCode);
    }

    private ResponseEntity<Object> respond(Exception ex, HttpStatusCode status, String message,
            Map<String, String> fields, HttpHeaders headers, WebRequest request) {
        return handleExceptionInternal(ex, apiError(status, message, fields, request), headers, status, request);
    }

    /** Sin mensaje propio, el mensaje general reúne los de los campos. */
    private ApiError apiError(HttpStatusCode status, String message, Map<String, String> fields, WebRequest request) {
        HttpStatus known = HttpStatus.resolve(status.value());
        String error = known == null ? "Error" : known.getReasonPhrase();
        String text = message != null && !message.isBlank() ? message
                : fields.isEmpty() ? error : String.join(" ", fields.values());
        return new ApiError(LocalDateTime.now(), status.value(), error, text, path(request),
                fields.isEmpty() ? null : fields);
    }

    private static void addFieldError(Map<String, String> fields, String field, String message, String rule) {
        if (!fields.containsKey(field) || REQUIRED_RULES.contains(rule)) fields.put(field, message);
    }

    /** Posición del campo en la clase; secondaryPhotos[2] usa la de secondaryPhotos. */
    private static int declaredIndex(List<String> order, String field) {
        int index = order.indexOf(field.replaceAll("[.\\[].*", ""));
        return index < 0 ? order.size() : index;
    }

    private static String lastCode(MessageSourceResolvable error) {
        String[] codes = error.getCodes();
        return codes == null || codes.length == 0 ? null : codes[codes.length - 1];
    }

    /** Campo del JSON que Jackson no pudo leer, por ejemplo status o room.roomType.roomTypeId. */
    private static String jsonField(HttpMessageNotReadableException ex) {
        JacksonException jackson = findCause(ex, JacksonException.class);
        if (jackson == null) return null;
        StringBuilder field = new StringBuilder();
        for (JacksonException.Reference reference : jackson.getPath()) {
            if (reference.getPropertyName() != null) {
                field.append(field.isEmpty() ? "" : ".").append(reference.getPropertyName());
            } else if (reference.getIndex() >= 0) {
                field.append('[').append(reference.getIndex()).append(']');
            }
        }
        return field.isEmpty() ? null : field.toString();
    }

    private static <T extends Throwable> T findCause(Throwable ex, Class<T> type) {
        for (Throwable cause = ex; cause != null; cause = cause.getCause() == cause ? null : cause.getCause()) {
            if (type.isInstance(cause)) return type.cast(cause);
        }
        return null;
    }

    private static String path(WebRequest request) {
        return request instanceof ServletWebRequest servlet ? servlet.getRequest().getRequestURI() : null;
    }
}
