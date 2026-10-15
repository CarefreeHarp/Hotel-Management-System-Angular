package com.example.demo.service;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.service.interfaces.ReservationService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Consultas de reservas: el perfil del cliente las lista, los servicios de
 * habitaciones y servicios leen sus totales antes de borrar, y el de clientes
 * deja sus reservas sin cliente antes de borrarlo.
 */
@Service
@org.springframework.transaction.annotation.Transactional
public class ReservationServiceImpl implements ReservationService {

    @Autowired
    public ReservationRepository reservationRepository;

    @Override
    public List<ReservationDTO> listReservations() {
        return reservationRepository.findAllForList();
    }

    @Override
    public List<ReservationDTO> listByClient(Integer clientId) {
        return reservationRepository.findAllForListByClientId(clientId);
    }

    @Override
    public ReservationDTO findDetail(Integer reservationId) {
        return ReservationDTO.from(reservationRepository.findById(reservationId).get());
    }

    @Override
    public int clearClient(Integer clientId) {
        return reservationRepository.clearClient(clientId);
    }

    @Override
    public long countByRoom(Integer roomId) {
        return reservationRepository.countByRoom_RoomId(roomId);
    }

    @Override
    public long countByService(Integer serviceId) {
        return reservationRepository.countByServices_ServiceId(serviceId);
    }

}
