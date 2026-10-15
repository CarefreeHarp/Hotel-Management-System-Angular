package com.example.demo.repository;

import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.dto.ServiceListDTO;
import com.example.demo.entities.Service;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * CAPA DE REPOSITORIO: acceso a la tabla SERVICE con Spring Data JPA.
 *
 * Se importa com.example.demo.entities.Service (la entidad) y no
 * org.springframework.stereotype.Service (la anotación), que se llama igual.
 */
@Repository
public interface ServiceRepository extends JpaRepository<Service, Integer> {

    /* Busca un servicio por su nombre de URL sin distinguir mayúsculas de minúsculas. */
    Optional<Service> findByUrlNameIgnoreCase(String urlName);

    /* Total de servicios del catálogo para el panel. */
    long countByActiveTrue();

    /* Tabla de servicios del panel: activos e inactivos, sin descripción ni galería. */
    @Query("""
            SELECT new com.example.demo.dto.ServiceListDTO(service.serviceId, service.name, service.summary,
                    service.category, service.price, service.mainImageUrl, service.active)
            FROM Service service
            ORDER BY service.serviceId
            """)
    List<ServiceListDTO> findAllForList();

    /* Catálogo de los huéspedes: solo los servicios activos y sin la galería. */
    @Query("""
            SELECT new com.example.demo.dto.ServiceCatalogDTO(service.serviceId, service.name, service.summary,
                    service.description, service.category, service.price, service.duration,
                    service.availability, service.location, service.mainImageUrl)
            FROM Service service
            WHERE service.active = true
            ORDER BY service.serviceId
            """)
    List<ServiceCatalogDTO> findAllForCatalog();
}
