package com.example.demo.controller;

import com.example.demo.dto.AccountingDashboard;
import com.example.demo.service.interfaces.AccountingService;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/accounting")
@CrossOrigin("http://localhost:4200")
public class AccountingController {
    private final AccountingService service;

    public AccountingController(AccountingService service) {
        this.service = service;
    }

    /** Consulta un período inclusivo. Spring convierte las fechas desde los parámetros de la URL. */
    @GetMapping
    public AccountingDashboard readAccountingDashboard(@RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return service.readAccountingDashboard(from, to);
    }
}
