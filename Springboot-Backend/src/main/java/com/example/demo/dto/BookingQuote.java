package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Un record transporta estos datos sin setters. Spring lo convierte a JSON para Angular. */
public record BookingQuote(RoomTypeListDTO roomType, LocalDate checkInDate, LocalDate checkOutDate,
        Integer guestCount, long nights, BigDecimal stayTotal, List<ServiceCatalogDTO> services,
        BigDecimal servicesTotal, BigDecimal subtotal, BigDecimal total) {
}
