package com.example.demo.service;

import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.ClientRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.repository.ServiceRepository;
import com.example.demo.service.interfaces.PanelService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Totales del panel de administración. count() hace un SELECT COUNT(*) en la base
 * de datos, así el panel no tiene que descargar todos los registros para contarlos.
 */
@Service
@Transactional(readOnly = true)
public class PanelServiceImpl implements PanelService {

    private final ServiceRepository serviceRepository;

    private final RoomTypeRepository roomTypeRepository;

    private final RoomRepository roomRepository;

    private final ClientRepository clientRepository;

    private final AdministratorRepository administratorRepository;

    private final OperatorRepository operatorRepository;

    private final ReservationRepository reservationRepository;

    public PanelServiceImpl(ServiceRepository serviceRepository, RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository, ClientRepository clientRepository,
            AdministratorRepository administratorRepository, OperatorRepository operatorRepository,
            ReservationRepository reservationRepository) {
        this.serviceRepository = serviceRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
        this.clientRepository = clientRepository;
        this.administratorRepository = administratorRepository;
        this.operatorRepository = operatorRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public Map<String, Long> countRecords() {
        Map<String, Long> counts = new LinkedHashMap<>();
        // Los servicios y habitaciones desactivados no se cuentan, igual que en sus listas.
        counts.put("services", serviceRepository.countByActivationStatus(ActivationStatus.ACTIVE));
        counts.put("roomTypes", roomTypeRepository.count());
        counts.put("rooms", roomRepository.countByActivationStatus(ActivationStatus.ACTIVE));
        counts.put("clients", clientRepository.count());
        counts.put("administrators", administratorRepository.count());
        counts.put("operators", operatorRepository.count());
        counts.put("reservations", reservationRepository.count());
        return counts;
    }

}
