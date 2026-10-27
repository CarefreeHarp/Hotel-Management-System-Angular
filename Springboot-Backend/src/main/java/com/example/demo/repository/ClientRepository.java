package com.example.demo.repository;

import com.example.demo.dto.ClientListDTO;
import com.example.demo.entities.Client;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/** Consultas y proyecciones de lectura de Client. */
@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    /* Busca un cliente por correo electrónico sin distinguir mayúsculas de minúsculas. */
    Optional<Client> findByEmailIgnoreCase(String email);

    /* Busca un cliente por su número de identificación nacional. */
    Optional<Client> findByNationalId(String nationalId);

    // Clientes del panel, sin foto ni contraseña.
    @Query("""
            SELECT new com.example.demo.dto.ClientListDTO(
                client.clientId,
                client.name,
                client.lastName,
                client.nationalId,
                client.email,
                client.phone
            )
            FROM Client client
            ORDER BY client.clientId
            """)
    List<ClientListDTO> findAllForList();
}
