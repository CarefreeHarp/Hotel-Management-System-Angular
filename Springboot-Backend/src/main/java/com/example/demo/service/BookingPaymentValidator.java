package com.example.demo.service;

import com.example.demo.entities.Payment;
import com.example.demo.exception.FieldException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Reglas del pago simulado. Los datos de tarjeta solo se usan para validar la petición. */
@Component
public class BookingPaymentValidator {
    private static final BigDecimal MIN_PAYMENT = new BigDecimal("100000");
    private static final BigDecimal MAX_PAYMENT = new BigDecimal("99999999.99");

    /** Pago simulado: importe permitido y datos de tarjeta con formato válido. Informa todos los campos a la vez. */
    public void validate(Payment payment, BigDecimal total) {
        Map<String, String> errors = new LinkedHashMap<>();
        // Se acumulan los errores para que el usuario pueda corregir toda la tarjeta en un intento.
        validateAmount(payment, total, errors);
        validateCardholder(payment, errors);
        validateCardNumber(payment, errors);
        validateExpiry(payment, errors);
        validateSecurityCode(payment, errors);
        if (!errors.isEmpty())
            throw new FieldException(HttpStatus.BAD_REQUEST, errors);
    }

    private void validateAmount(Payment payment, BigDecimal total, Map<String, String> errors) {
        BigDecimal amount = payment.getAmount();
        if (amount == null)
            errors.put("initialPayment.amount", "Enter the amount to pay.");
        // Se ignoran los ceros finales antes de contar los decimales del importe.
        else if (amount.stripTrailingZeros().scale() > 2)
            errors.put("initialPayment.amount", "The amount can have at most two decimals.");
        else if (amount.compareTo(MIN_PAYMENT) < 0 || amount.compareTo(total) > 0)
            errors.put("initialPayment.amount", "Payment must be at least " + cop(MIN_PAYMENT)
                    + " and cannot exceed the total of " + cop(total) + ".");
        else if (amount.compareTo(MAX_PAYMENT) > 0)
            errors.put("initialPayment.amount", "A single payment cannot exceed " + cop(MAX_PAYMENT) + ".");
    }

    private void validateCardholder(Payment payment, Map<String, String> errors) {
        String name = text(payment.getCardholderName());
        if (name.isEmpty())
            errors.put("initialPayment.cardholderName", "Enter the name on the card.");
        else if (name.length() > 100 || !name.matches("[\\p{L} .'-]+"))
            errors.put("initialPayment.cardholderName",
                    "Enter the name as it appears on the card, using letters only (up to 100 characters).");
    }

    private void validateCardNumber(Payment payment, Map<String, String> errors) {
        String number = text(payment.getCardNumber()).replaceAll("[\\s-]", "");
        if (number.isEmpty())
            errors.put("initialPayment.cardNumber", "Enter the card number.");
        else if (!number.matches("[0-9]{13,19}"))
            errors.put("initialPayment.cardNumber", "The card number must have between 13 and 19 digits.");
    }

    private void validateExpiry(Payment payment, Map<String, String> errors) {
        String expiry = text(payment.getExpiryDate());
        if (expiry.isEmpty())
            errors.put("initialPayment.expiryDate", "Enter the expiry date.");
        else if (!expiry.matches("(0[1-9]|1[0-2])/[0-9]{2}"))
            errors.put("initialPayment.expiryDate", "Enter the expiry date as MM/YY, with a month from 01 to 12.");
        else {
            YearMonth expires = YearMonth.of(2000 + Integer.parseInt(expiry.substring(3)),
                    Integer.parseInt(expiry.substring(0, 2)));
            if (expires.isBefore(YearMonth.now()))
                errors.put("initialPayment.expiryDate", "The card has expired.");
            else if (expires.isAfter(YearMonth.now().plusYears(20)))
                errors.put("initialPayment.expiryDate", "Enter a valid expiry date.");
        }
    }

    private void validateSecurityCode(Payment payment, Map<String, String> errors) {
        String code = text(payment.getSecurityCode());
        if (code.isEmpty())
            errors.put("initialPayment.securityCode", "Enter the security code.");
        else if (!code.matches("[0-9]{3,4}"))
            errors.put("initialPayment.securityCode", "The security code must have 3 or 4 digits.");
    }

    private static String text(String value) {
        return value == null ? "" : value.trim();
    }

    private static String cop(BigDecimal amount) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMaximumFractionDigits(2);
        return "COP " + format.format(amount);
    }
}
