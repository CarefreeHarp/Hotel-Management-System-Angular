package com.example.demo.service.interfaces;

import com.example.demo.dto.AccountingDashboard;
import java.time.LocalDate;

public interface AccountingService {
    /** Consulta agregados financieros y de reservas para un período inclusivo con tendencia mensual. */
    AccountingDashboard readAccountingDashboard(LocalDate from, LocalDate to);
}
