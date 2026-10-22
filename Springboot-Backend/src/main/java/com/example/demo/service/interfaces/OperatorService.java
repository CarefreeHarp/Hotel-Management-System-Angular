package com.example.demo.service.interfaces;

import com.example.demo.dto.OperatorDTO;
import com.example.demo.entities.Operator;
import java.util.List;

/**
 * Contrato de negocio. Los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO. Las entidades solo se usan dentro del backend.
 */
public interface OperatorService {
    List<OperatorDTO> listOperators();

    List<OperatorDTO> listByAdministrator(Integer adminId);

    OperatorDTO findDetail(Integer operatorId);

    Operator findById(Integer operatorId);

    void create(Operator operator, Integer adminId);

    void update(Integer operatorId, Operator operator, Integer adminId);

    void delete(Integer operatorId);

    OperatorDTO login(String email, String password);
}
