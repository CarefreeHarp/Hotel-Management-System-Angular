package com.example.demo.controller;

import com.example.demo.dto.ServiceCatalogDTO;
import com.example.demo.dto.ServiceDetailDTO;
import com.example.demo.dto.ServiceListDTO;
import com.example.demo.entities.Service;
import com.example.demo.service.interfaces.ServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/services")
@CrossOrigin("http://localhost:4200")
public class ServiceController {

    private final ServiceService service;

    public ServiceController(ServiceService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar servicios", description = "Devuelve las filas de la tabla del panel (activos e inactivos) con solo las columnas que se muestran.")
    public List<ServiceListDTO> listServices() {
        return service.listServices();
    }

    @GetMapping("/catalog")
    @Operation(summary = "Catálogo de servicios", description = "Devuelve solo los servicios activos, con los datos que ven los huéspedes.")
    public List<ServiceCatalogDTO> listCatalog() {
        return service.listCatalog();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un servicio", description = "Devuelve todos los atributos del servicio.")
    public ServiceDetailDTO readService(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear un servicio", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createService(@RequestBody Service hotelService) {
        service.create(hotelService);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un servicio", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene.")
    public void updateService(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
                           @RequestBody Service hotelService) {
        service.update(id, hotelService);
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Desactivar un servicio", description = "El servicio se conserva con sus reservas, sale del catálogo y pasa a la sección de inactivos.")
    public void deactivateService(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.deactivate(id);
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activar un servicio", description = "El servicio vuelve a la lista principal y al catálogo.")
    public void activateService(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.activate(id);
    }

    @GetMapping("/by-url-name/{urlName}")
    @Operation(summary = "Consultar un servicio por su nombre de URL", description = "Consulta el catálogo mediante el campo único urlName.")
    public ServiceDetailDTO readServiceByUrlName(@Parameter(description = "Unique service slug", example = "spa-ritual") @PathVariable String urlName) {
        return service.findDetailByUrlName(urlName);
    }
}
