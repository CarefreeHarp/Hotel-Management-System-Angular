package com.example.demo.dto;

import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ActivationStatus;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detalle y formulario de un servicio: muestran todos sus atributos, así que el
 * DTO tiene los mismos que la entidad.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDetailDTO {
    private Integer serviceId;
    private String name;
    private String urlName;
    private String description;
    private BigDecimal price;
    private String category;
    private ActivationStatus activationStatus;
    private String summary;
    private String duration;
    private String availability;
    private String location;
    private String mainImageUrl;
    private List<String> secondaryImageUrls;

    public static ServiceDetailDTO from(Service service) {
        return new ServiceDetailDTO(service.getServiceId(), service.getName(), service.getUrlName(),
                service.getDescription(), service.getPrice(), service.getCategory(), service.getActivationStatus(),
                service.getSummary(), service.getDuration(), service.getAvailability(), service.getLocation(),
                service.getMainImageUrl(), new ArrayList<>(service.getSecondaryImageUrls()));
    }
}
