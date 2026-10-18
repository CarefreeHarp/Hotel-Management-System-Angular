package com.example.demo.service;

import com.example.demo.dto.ClientDetailDTO;
import com.example.demo.dto.ClientListDTO;
import com.example.demo.entities.Client;
import com.example.demo.exception.FieldException;
import com.example.demo.service.interfaces.ClientService;
import com.example.demo.service.interfaces.ReservationService;
import com.example.demo.repository.ClientRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Operaciones CRUD de clientes con persistencia en H2. */
@Service
@org.springframework.transaction.annotation.Transactional
public class ClientServiceImpl implements ClientService {

    @Autowired
    public ClientRepository clientRepository;

    @Autowired
    public ReservationService reservationService;

    @Override
    public List<ClientListDTO> listClients() {
        return clientRepository.findAllForList();
    }

    @Override
    public ClientDetailDTO findDetail(Integer clientId) {
        return ClientDetailDTO.from(findById(clientId));
    }

    @Override
    public Client findById(Integer clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found."));
    }

    @Override
    public void register(Client client) {
        // El id lo genera la base de datos. Se envía en null para que haga un INSERT:
        // el contrato de entrada no permite indicar el id.
        client.setClientId(null);

        checkUniqueFields(client, null);
        clientRepository.save(client);
    }

    @Override
    public void updateProfile(Integer clientId, Client client) {
        Client registeredClient = findById(clientId);

        checkUniqueFields(client, registeredClient.getClientId());

        // Se conserva el id para que save() actualice la fila que ya existe en vez
        // de insertar una nueva, y la contraseña porque el CRUD REST no la modifica.
        client.setClientId(registeredClient.getClientId());
        client.setPassword(registeredClient.getPassword());

        clientRepository.save(client);
    }

    @Override
    public void deleteProfile(Integer clientId) {
        Client registeredClient = findById(clientId);

        // Un cliente sí se puede borrar: sus reservas se quedan en el historial con
        // client_id en null, para que la llave foránea no impida el DELETE.
        reservationService.clearClient(registeredClient.getClientId());

        clientRepository.delete(registeredClient);
    }

    @Override
    public ClientDetailDTO login(String email, String password) {
        // La base de datos busca al cliente por su correo: no se descargan todos los clientes.
        // Se devuelve el DTO, así la contraseña no viaja de vuelta al navegador.
        return clientRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .filter(client -> client.getPassword().equals(password))
                .map(ClientDetailDTO::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password."));
    }

    /**
     * El correo y el documento son únicos. La base de datos los busca: no hace falta
     * descargar todos los clientes en el navegador para revisar si ya existen. Si los
     * dos están repetidos, la respuesta 409 informa ambos campos a la vez.
     */
    private void checkUniqueFields(Client client, Integer clientId) {
        Map<String, String> conflicts = new LinkedHashMap<>();
        clientRepository.findByEmailIgnoreCase(client.getEmail())
                .filter(other -> !other.getClientId().equals(clientId))
                .ifPresent(other -> conflicts.put("email", "This email is already registered."));
        clientRepository.findByNationalId(client.getNationalId())
                .filter(other -> !other.getClientId().equals(clientId))
                .ifPresent(other -> conflicts.put("nationalId", "This national ID is already registered."));
        if (!conflicts.isEmpty()) {
            throw new FieldException(HttpStatus.CONFLICT, conflicts);
        }
    }

}
