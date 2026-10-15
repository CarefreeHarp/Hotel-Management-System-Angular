package com.example.demo.dto;

import com.example.demo.entities.Client;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detalle, formulario y perfil de un cliente. Muestran todos los atributos menos
 * la contraseña, que nunca se envía al navegador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDetailDTO {
    private Integer clientId;
    private String name;
    private String lastName;
    private String nationalId;
    private String phone;
    private String email;
    private String profilePhoto;

    public static ClientDetailDTO from(Client client) {
        return new ClientDetailDTO(client.getClientId(), client.getName(), client.getLastName(),
                client.getNationalId(), client.getPhone(), client.getEmail(), client.getProfilePhoto());
    }
}
