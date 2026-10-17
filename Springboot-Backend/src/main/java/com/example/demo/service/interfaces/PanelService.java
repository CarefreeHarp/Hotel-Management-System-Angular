package com.example.demo.service.interfaces;

import java.util.Map;

/** Contrato de negocio; los controladores REST no acceden a repositorios. */
public interface PanelService {
    Map<String, Long> countRecords();
}
