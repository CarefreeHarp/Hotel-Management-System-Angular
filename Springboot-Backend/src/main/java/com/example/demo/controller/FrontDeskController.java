package com.example.demo.controller;

import com.example.demo.dto.FrontDeskBoard;
import com.example.demo.service.interfaces.FrontDeskService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/front-desk")
@CrossOrigin("http://localhost:4200")
public class FrontDeskController {

    private final FrontDeskService service;

    public FrontDeskController(FrontDeskService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Consultar el tablero del operario", description = "Devuelve las llegadas, los huéspedes alojados, las salidas pendientes y las habitaciones en limpieza o mantenimiento de la fecha del servidor.")
    public FrontDeskBoard readBoard() {
        return service.readBoard();
    }
}
