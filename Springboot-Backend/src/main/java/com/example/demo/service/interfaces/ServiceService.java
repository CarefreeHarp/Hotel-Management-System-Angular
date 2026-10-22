package com.example.demo.service.interfaces;

import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.dto.ServiceDetailDTO;
import com.example.demo.dto.ServiceListDTO;
import com.example.demo.entities.Service;
import java.util.List;

/**
 * Contrato de negocio. Los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO. Las entidades solo se usan dentro del backend.
 */
public interface ServiceService {
    List<ServiceListDTO> listServices();

    List<ServiceCatalogDTO> listCatalog();

    ServiceDetailDTO findDetail(Integer serviceId);

    ServiceDetailDTO findDetailByUrlName(String urlName);

    Service findById(Integer serviceId);

    void create(Service service);

    void update(Integer serviceId, Service service);

    void activate(Integer serviceId);

    void deactivate(Integer serviceId);
}
