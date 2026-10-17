package com.example.demo.service.interfaces;

import com.example.demo.dto.ClientDetailDTO;
import com.example.demo.dto.ClientListDTO;
import com.example.demo.entities.Client;
import java.util.List;

/**
 * Contrato de negocio; los controladores REST no acceden a repositorios.
 * Hacia la pantalla salen DTO; las entidades solo se usan dentro del backend.
 */
public interface ClientService {
    List<ClientListDTO> listClients();
    ClientDetailDTO findDetail(Integer clientId);
    Client findById(Integer clientId);
    void register(Client client);
    void updateProfile(Integer clientId, Client client);
    void deleteProfile(Integer clientId);
    ClientDetailDTO login(String email, String password);
}
