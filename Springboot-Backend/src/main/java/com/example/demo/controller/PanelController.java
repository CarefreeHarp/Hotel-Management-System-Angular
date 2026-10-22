package com.example.demo.controller;

import com.example.demo.service.interfaces.PanelService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/panel")
@CrossOrigin("http://localhost:4200")
public class PanelController {

    private final PanelService service;

    public PanelController(PanelService service) {
        this.service = service;
    }

    @GetMapping("/counts")
    @Operation(summary = "Contar registros del panel", description = "Devuelve cuántos registros hay de cada módulo sin enviar los registros.")
    public Map<String, Long> countRecords() {
        return service.countRecords();
    }
}
