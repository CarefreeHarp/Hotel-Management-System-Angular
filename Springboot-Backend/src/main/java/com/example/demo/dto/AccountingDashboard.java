package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Solo agregados para contabilidad. No transporta entidades, clientes ni movimientos individuales. */
public record AccountingDashboard(LocalDate from, LocalDate to,
        FinancialSummary financial, StaySummary stays, List<StatusCount> statuses,
        List<TrendPoint> trend, List<RoomRanking> roomTypes, List<ServiceRanking> services) {
    public record FinancialSummary(BigDecimal payments, BigDecimal refunds,
            BigDecimal netCollected, BigDecimal outstanding) { }

    public record StaySummary(double averageNights, double averageGuests) { }

    public record StatusCount(String status, long reservations, double percentage) { }

    public record TrendPoint(LocalDate date, long reservations) { }

    public record RoomRanking(String name, long reservations, long nights) { }

    public record ServiceRanking(String name, long quantity, BigDecimal value) { }

}
