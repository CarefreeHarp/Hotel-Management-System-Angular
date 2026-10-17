package com.example.demo.service;

import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.dto.ServiceDetailDTO;
import com.example.demo.dto.ServiceListDTO;
import com.example.demo.entities.Service;
import com.example.demo.repository.ServiceRepository;
import com.example.demo.service.interfaces.ReservationService;
import com.example.demo.service.interfaces.ServiceService;
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
    private final ReservationService reservationService;

    public ServiceServiceImpl(ServiceRepository serviceRepository, ReservationService reservationService) {
        this.serviceRepository = serviceRepository;
        this.reservationService = reservationService;
    }

    @Override
    public List<ServiceListDTO> listServices() {
        // Activos e inactivos: la pantalla del panel los separa en dos secciones.
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
        return ServiceDetailDTO.from(serviceRepository.findByUrlNameIgnoreCase(urlName).get());
    }

    @Override
    public Service findById(Integer serviceId) {
        return serviceRepository.findById(serviceId).get();
    }

    @Override
    public void create(Service service) {
        service.setServiceId(null);
        service.setActive(true);
        checkUrlNameIsFree(service, null);
        if (service.getSecondaryImageUrls() == null) service.setSecondaryImageUrls(new ArrayList<>());
        serviceRepository.save(service);
    }

    @Override
    public void update(Integer serviceId, Service service) {
        Service registered = findById(serviceId);
        checkUrlNameIsFree(service, registered.getServiceId());
        service.setServiceId(registered.getServiceId());
        // El estado activo no viene del formulario: solo lo cambian los botones de activar y desactivar.
        service.setActive(registered.getActive());
        if (service.getSecondaryImageUrls() == null) service.setSecondaryImageUrls(new ArrayList<>());
        serviceRepository.save(service);
    }

    @Override
    public void delete(Integer serviceId) {
        Service registered = findById(serviceId);

        // El repositorio cuenta las reservas con una consulta. Un servicio con
        // reservas no se borra, para no perder el historial: se puede desactivar.
        long reservations = reservationService.countByService(registered.getServiceId());
        if (reservations > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "\"" + registered.getName() + "\" cannot be deleted because it is part of " + reservations
                            + " reservation(s). Deactivate it instead.");
        }

        serviceRepository.delete(registered);
    }

    @Override
    public void activate(Integer serviceId) {
        Service registered = findById(serviceId);
        registered.setActive(true);
        serviceRepository.save(registered);
    }

    @Override
    public void deactivate(Integer serviceId) {
        // El servicio se conserva con sus reservas; sale del catálogo y pasa a la sección de inactivos.
        Service registered = findById(serviceId);
        registered.setActive(false);
        serviceRepository.save(registered);
    }

    /**
     * El nombre de URL sale del nombre del servicio y es único: si otro servicio ya
     * lo usa se responde 409 y el formulario muestra el motivo.
     */
    private void checkUrlNameIsFree(Service service, Integer serviceId) {
        serviceRepository.findByUrlNameIgnoreCase(service.getUrlName())
                .filter(other -> !other.getServiceId().equals(serviceId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Another service is already called \"" + other.getName() + "\".");
                });
    }

}
