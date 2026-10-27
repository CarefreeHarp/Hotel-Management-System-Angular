package com.example.demo.service;

import com.example.demo.dto.ClientDetailDTO;
import com.example.demo.dto.ClientListDTO;
import com.example.demo.entities.Client;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.ClientRepository;
import com.example.demo.service.interfaces.ClientService;
import com.example.demo.service.interfaces.ReservationService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD de clientes con persistencia en H2. */
@Service
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    private final ReservationService reservationService;

    public ClientServiceImpl(ClientRepository clientRepository, ReservationService reservationService) {
        this.clientRepository = clientRepository;
        this.reservationService = reservationService;
    }

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
        // Un correo inexistente o una contraseña incorrecta producen el mismo rechazo de acceso.
        Client account = clientRepository.findByEmailIgnoreCase(email == null ? "" : email.trim()).orElse(null);
        if (account == null || !account.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        return ClientDetailDTO.from(account);
    }

    /**
     * El correo y el documento son únicos. La base de datos los busca: no hace falta
     * descargar todos los clientes en el navegador para revisar si ya existen. Si los
     * dos están repetidos, la respuesta 409 informa ambos campos a la vez.
     */
    private void checkUniqueFields(Client client, Integer clientId) {
        Map<String, String> conflicts = new LinkedHashMap<>();
        Client sameEmail = clientRepository.findByEmailIgnoreCase(client.getEmail()).orElse(null);
        if (sameEmail != null && !sameEmail.getClientId().equals(clientId)) {
            conflicts.put("email", "This email is already registered.");
        }
        Client sameNationalId = clientRepository.findByNationalId(client.getNationalId()).orElse(null);
        if (sameNationalId != null && !sameNationalId.getClientId().equals(clientId)) {
            conflicts.put("nationalId", "This national ID is already registered.");
        }
        if (!conflicts.isEmpty()) {
            throw new FieldException(HttpStatus.CONFLICT, conflicts);
        }
    }

}
