package com.example.demo.service;

import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.dto.ServiceDetailDTO;
import com.example.demo.dto.ServiceListDTO;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.ServiceRepository;
import com.example.demo.service.interfaces.ServiceService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD del catálogo de servicios. */
@org.springframework.stereotype.Service
@Transactional
public class ServiceServiceImpl implements ServiceService {
    private final ServiceRepository serviceRepository;
    private final ReservationRepository reservationRepository;

    public ServiceServiceImpl(ServiceRepository serviceRepository, ReservationRepository reservationRepository) {
        this.serviceRepository = serviceRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public List<ServiceListDTO> listServices() {
        // Incluye ambos estados de activación para los filtros de gestión.
        return serviceRepository.findAllForList();
    }

    @Override
    public List<ServiceCatalogDTO> listCatalog() {
        // Los huéspedes solo ven los servicios activos.
        return serviceRepository.findAllForCatalog();
    }

    @Override
    public ServiceDetailDTO findDetail(Integer serviceId) {
        return ServiceDetailDTO.from(findById(serviceId));
    }

    @Override
    public ServiceDetailDTO findDetailByUrlName(String urlName) {
        return ServiceDetailDTO.from(serviceRepository.findByUrlNameIgnoreCase(urlName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found.")));
    }

    @Override
    public Service findById(Integer serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found."));
    }

    @Override
    public void create(Service service) {
        service.setServiceId(null);
        checkUrlNameIsFree(service, null);
        if (service.getSecondaryImageUrls() == null)
            service.setSecondaryImageUrls(new ArrayList<>());
        serviceRepository.save(service);
    }

    @Override
    public void update(Integer serviceId, Service service) {
        Service registered = findById(serviceId);
        if (service.getActivationStatus() == ActivationStatus.INACTIVE
                && registered.getActivationStatus() == ActivationStatus.ACTIVE) {
            checkCanDeactivate(serviceId);
        }
        checkUrlNameIsFree(service, registered.getServiceId());
        service.setServiceId(registered.getServiceId());
        if (service.getSecondaryImageUrls() == null)
            service.setSecondaryImageUrls(new ArrayList<>());
        serviceRepository.save(service);
    }

    @Override
    public void activate(Integer serviceId) {
        Service registered = findById(serviceId);
        registered.setActivationStatus(ActivationStatus.ACTIVE);
        serviceRepository.save(registered);
    }

    @Override
    public void deactivate(Integer serviceId) {
        // Sale del catálogo sin modificar los cargos existentes.
        Service registered = findById(serviceId);
        checkCanDeactivate(serviceId);
        registered.setActivationStatus(ActivationStatus.INACTIVE);
        serviceRepository.save(registered);
    }

    private void checkCanDeactivate(Integer serviceId) {
        if (reservationRepository.existsByServices_ServiceIdAndStatusNotAndCheckOutDateAfter(
                serviceId, ReservationStatus.CANCELLED, LocalDate.now())) {
            throw new FieldException(HttpStatus.CONFLICT, "activationStatus",
                    "This service cannot be deactivated because it is included in upcoming or ongoing reservations. Cancel those reservations or remove the service first.");
        }
    }

    /**
     * El nombre de URL sale del nombre del servicio y es único: si otro servicio ya
     * lo usa se responde 409 y el formulario muestra el motivo en el campo del nombre.
     */
    private void checkUrlNameIsFree(Service service, Integer serviceId) {
        Service existingService = serviceRepository.findByUrlNameIgnoreCase(service.getUrlName()).orElse(null);
        if (existingService != null && !existingService.getServiceId().equals(serviceId)) {
            throw new FieldException(HttpStatus.CONFLICT, "name",
                    "Another service is already called \"" + existingService.getName() + "\".");
        }
    }

}
