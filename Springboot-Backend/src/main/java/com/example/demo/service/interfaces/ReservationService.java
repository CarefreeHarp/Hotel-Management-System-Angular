package com.example.demo.service.interfaces;

import com.example.demo.dto.ReservationDTO;
import java.util.List;

/**
 * Contrato de negocio; los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO; las entidades solo se usan dentro del backend.
 */
public interface ReservationService {
    List<ReservationDTO> listReservations();
    List<ReservationDTO> listByClient(Integer clientId);
    ReservationDTO findDetail(Integer reservationId);
    int clearClient(Integer clientId);
    long countByRoom(Integer roomId);
    long countByService(Integer serviceId);
}
