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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Totales del panel de administración. count() hace un SELECT COUNT(*) en la base
 * de datos, así el panel no tiene que descargar todos los registros para contarlos.
 */
@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class PanelServiceImpl implements PanelService {

    @Autowired
    public ServiceRepository serviceRepository;

    @Autowired
    public RoomTypeRepository roomTypeRepository;

    @Autowired
    public RoomRepository roomRepository;

    @Autowired
    public ClientRepository clientRepository;

    @Autowired
    public AdministratorRepository administratorRepository;

    @Autowired
    public OperatorRepository operatorRepository;

    @Autowired
    public ReservationRepository reservationRepository;

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
