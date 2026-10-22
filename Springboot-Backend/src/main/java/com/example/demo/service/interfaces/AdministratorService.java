package com.example.demo.service.interfaces;

import com.example.demo.dto.AdministratorDTO;
import com.example.demo.dto.AdministratorListDTO;
import com.example.demo.entities.Administrator;
import java.util.List;

/**
 * Contrato de negocio. Los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO. Las entidades solo se usan dentro del backend.
 */
public interface AdministratorService {
    List<AdministratorListDTO> listAdministrators();

    List<AdministratorDTO> listOptions();

    AdministratorDTO findDetail(Integer adminId);

    Administrator findById(Integer adminId);

    void create(Administrator administrator);

    void update(Integer adminId, Administrator administrator);

    void delete(Integer adminId);

    AdministratorDTO login(String email, String password);
}
