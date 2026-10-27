package com.example.demo.service;

import com.example.demo.dto.AccountingDashboard.FinancialSummary;
import com.example.demo.dto.AccountingDashboard.RoomRanking;
import com.example.demo.dto.AccountingDashboard.ServiceRanking;
import com.example.demo.dto.AccountingDashboard.StatusCount;
import com.example.demo.dto.AccountingDashboard.StaySummary;
import com.example.demo.dto.AccountingDashboard.TrendPoint;
import com.example.demo.dto.AccountingDashboard;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.repository.AccountingRepository;
import com.example.demo.service.interfaces.AccountingService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/** Coordina consultas agregadas y completa bloques vacíos. Nunca carga entidades para calcular estadísticas. */
@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class AccountingServiceImpl implements AccountingService {
    private final AccountingRepository repository;

    public AccountingServiceImpl(AccountingRepository repository) {
        this.repository = repository;
    }

    /** Resuelve límites, consulta agregados en una lectura consistente y arma únicamente el modelo de pantalla. */
    @Override
    public AccountingDashboard readAccountingDashboard(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime until = to.plusDays(1).atStartOfDay();
        BigDecimal payments = repository.sumApprovedPayments(start, until);
        BigDecimal refunds = repository.sumApprovedRefunds(start, until);
        FinancialSummary financial = new FinancialSummary(payments, refunds, payments.subtract(refunds),
                repository.sumOutstandingBalances(start, until));

        List<AccountingRepository.StatusRow> statusRows = repository.countReservationsByStatus(start, until);
        List<StatusCount> statuses = statusDistribution(statusRows);
        List<TrendPoint> trend = reservationTrend(from, to, start, until);
        List<RoomRanking> rooms = repository.rankRoomTypes(start, until).stream()
                .map(row -> new RoomRanking(row.getName(), row.getReservations(), row.getNights())).toList();
        List<ServiceRanking> services = repository.rankServices(start, until).stream()
                .map(row -> new ServiceRanking(row.getName(), row.getQuantity(), row.getChargedValue())).toList();
        AccountingRepository.StayRow stay = repository.summarizeStays(start, until);
        StaySummary stays = new StaySummary(stay.getAverageNights(), stay.getAverageGuests());
        return new AccountingDashboard(from, to, financial, stays, statuses, trend, rooms, services);
    }

    /** Completa con cero los tres estados mostrados y calcula porcentajes sobre su total. */
    private List<StatusCount> statusDistribution(List<AccountingRepository.StatusRow> rows) {
        long total = rows.stream().mapToLong(AccountingRepository.StatusRow::getReservations).sum();
        Map<String, Long> counts = new HashMap<>();
        for (AccountingRepository.StatusRow row : rows) {
            counts.put(row.getStatus(), row.getReservations());
        }
        List<StatusCount> result = new ArrayList<>();
        for (ReservationStatus status : List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED,
                ReservationStatus.CHECKED_IN)) {
            long count = counts.getOrDefault(status.name(), 0L);
            double percentage = total == 0 ? 0 : count * 100.0 / total;
            result.add(new StatusCount(status.name(), count, percentage));
        }
        return result;
    }

    /** Rellena meses sin reservas con cero. El primer mes conserva el filtro exacto de fechas de la consulta. */
    private List<TrendPoint> reservationTrend(LocalDate from, LocalDate to,
            LocalDateTime start, LocalDateTime until) {
        Map<LocalDate, Long> counts = new HashMap<>();
        for (AccountingRepository.TrendRow row : repository.countReservationTrend(start, until)) {
            counts.put(row.getBucket(), row.getReservations());
        }
        LocalDate bucket = from.withDayOfMonth(1);
        List<TrendPoint> result = new ArrayList<>();
        while (!bucket.isAfter(to)) {
            result.add(new TrendPoint(bucket, counts.getOrDefault(bucket, 0L)));
            bucket = bucket.plusMonths(1);
        }
        return result;
    }
}
