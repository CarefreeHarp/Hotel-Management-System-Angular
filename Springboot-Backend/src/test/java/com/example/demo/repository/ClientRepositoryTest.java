package com.example.demo.repository;

import com.example.demo.entities.Client;
import java.util.List;
import java.util.Optional;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * Pruebas de integración del CRUD de clientes: crear, leer, actualizar y eliminar con los métodos
 * que ClientRepository hereda de JpaRepository. Las consultas propias del repositorio
 * (findByEmailIgnoreCase, findByNationalId y findAllForList) no se prueban aquí.
 *
 * Las pruebas nunca usan ni modifican la base de datos real (data/atlan-suites):
 * - @AutoConfigureTestDatabase(replace = ANY) cambia la conexión de application.properties por una
 *   base H2 en memoria, creada solo para las pruebas, que desaparece al terminar.
 * - @DataJpaTest carga solo la capa JPA (entidades y repositorios). El DataLoader no se ejecuta,
 *   así que la base empieza vacía, sin los datos de demostración.
 * - @DataJpaTest abre una transacción por prueba y la revierte al final: lo que guarda una prueba
 *   no lo ve la siguiente.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class ClientRepositoryTest {

    @Autowired
    private ClientRepository clientRepository;

    // Envía los cambios a la base de datos y vacía la caché de JPA (ver flushAndClear).
    @Autowired
    private TestEntityManager entityManager;

    // Clientes que setUp guarda antes de cada prueba.
    private Client ana;
    private Client luis;
    private Client sofia;

    @BeforeEach
    public void setUp() {
        // Los ids se toman de lo que devuelve save. La base no reinicia el contador al revertir
        // cada prueba, así que no se puede suponer que el primer cliente guardado tiene el id 1.
        ana = clientRepository.save(newClient("Ana", "Gómez", "1000000001", "3000000001", "ana.gomez@test.com"));
        luis = clientRepository.save(newClient("Luis", "Pérez", "1000000002", "3000000002", "luis.perez@test.com"));
        sofia = clientRepository.save(newClient("Sofía", "Rojas", "1000000003", "3000000003", "sofia.rojas@test.com"));

        // Las pruebas leen estos clientes de la base de datos y no de la memoria.
        flushAndClear();
    }

    // ---------- Crear (Create) ----------

    @Test
    public void ClientRepository_save_ClientWithGeneratedId() {
        // arrange
        // Un cliente nuevo, todavía sin id.
        Client client = newClient("Carlos", "Ruiz", "1000000004", "3000000004", "carlos.ruiz@test.com");

        // act
        Client savedClient = clientRepository.save(client);
        flushAndClear();

        // assert
        // La base de datos le asigna un id al guardarlo.
        Assertions.assertThat(savedClient).isNotNull();
        Assertions.assertThat(savedClient.getClientId()).isNotNull().isPositive();

        // Al leerlo de nuevo de la base de datos tiene los mismos datos.
        Optional<Client> storedClient = clientRepository.findById(savedClient.getClientId());
        Assertions.assertThat(storedClient).isPresent();
        Assertions.assertThat(storedClient.get().getName()).isEqualTo("Carlos");
        Assertions.assertThat(storedClient.get().getLastName()).isEqualTo("Ruiz");
        Assertions.assertThat(storedClient.get().getNationalId()).isEqualTo("1000000004");
        Assertions.assertThat(storedClient.get().getPhone()).isEqualTo("3000000004");
        Assertions.assertThat(storedClient.get().getEmail()).isEqualTo("carlos.ruiz@test.com");
    }

    @Test
    public void ClientRepository_save_DuplicateNationalIdThrowsException() {
        // arrange
        // Otro cliente con la misma cédula de Ana. La columna national_id es única.
        Client client = newClient("Pedro", "Díaz", ana.getNationalId(), "3000000005", "pedro.diaz@test.com");

        // act
        // saveAndFlush envía el INSERT en ese momento y captura el error que devuelve la base de datos.
        Throwable thrown = Assertions.catchThrowable(() -> clientRepository.saveAndFlush(client));

        // assert
        Assertions.assertThat(thrown).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    public void ClientRepository_save_DuplicateEmailThrowsException() {
        // arrange
        // Otro cliente con el correo de Luis. La columna email es única.
        Client client = newClient("Pedro", "Díaz", "1000000006", "3000000006", luis.getEmail());

        // act
        Throwable thrown = Assertions.catchThrowable(() -> clientRepository.saveAndFlush(client));

        // assert
        Assertions.assertThat(thrown).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ---------- Leer (Read) ----------

    @Test
    public void ClientRepository_findById_ReturnsClient() {
        // arrange
        Integer index = ana.getClientId();

        // act
        Optional<Client> client = clientRepository.findById(index);

        // assert
        // Encuentra a Ana con los datos que guardó setUp.
        Assertions.assertThat(client).isPresent();
        Assertions.assertThat(client.get().getName()).isEqualTo("Ana");
        Assertions.assertThat(client.get().getLastName()).isEqualTo("Gómez");
        Assertions.assertThat(client.get().getNationalId()).isEqualTo("1000000001");
        Assertions.assertThat(client.get().getEmail()).isEqualTo("ana.gomez@test.com");
    }

    @Test
    public void ClientRepository_findById_WrongIndexReturnsEmpty() {
        // arrange
        // Ningún cliente tiene un id negativo.
        Integer index = -1;

        // act
        Optional<Client> client = clientRepository.findById(index);

        // assert
        Assertions.assertThat(client).isEmpty();
    }

    @Test
    public void ClientRepository_findAll_NotEmptyList() {
        // arrange
        // Dos clientes más, además de los tres de setUp.
        Client client = newClient("Carlos", "Ruiz", "1000000007", "3000000007", "carlos.ruiz@test.com");
        Client client2 = newClient("Marta", "León", "1000000008", "3000000008", "marta.leon@test.com");

        // act
        clientRepository.save(client);
        clientRepository.save(client2);
        List<Client> clients = clientRepository.findAll();

        // assert
        // Solo están los 5 clientes de la prueba: la base no tiene datos reales.
        Assertions.assertThat(clients).isNotNull();
        Assertions.assertThat(clients.size()).isGreaterThan(0);
        Assertions.assertThat(clients.size()).isEqualTo(5);
        Assertions.assertThat(clients)
                .extracting(Client::getEmail)
                .containsExactlyInAnyOrder(
                        "ana.gomez@test.com",
                        "luis.perez@test.com",
                        "sofia.rojas@test.com",
                        "carlos.ruiz@test.com",
                        "marta.leon@test.com");
    }

    // ---------- Actualizar (Update) ----------

    @Test
    public void ClientRepository_save_UpdatesExistingClient() {
        // arrange
        // Se cambian el apellido, el teléfono y el correo de Luis.
        Client client = clientRepository.findById(luis.getClientId()).orElseThrow();
        client.setLastName("Pérez Gómez");
        client.setPhone("3009999999");
        client.setEmail("luis.nuevo@test.com");

        // act
        // save con un cliente que ya tiene id lo actualiza. flushAndClear envía el UPDATE.
        clientRepository.save(client);
        flushAndClear();

        // assert
        // Al leerlo de la base de datos tiene los datos nuevos y conserva los que no cambiaron.
        Client updatedClient = clientRepository.findById(luis.getClientId()).orElseThrow();
        Assertions.assertThat(updatedClient.getLastName()).isEqualTo("Pérez Gómez");
        Assertions.assertThat(updatedClient.getPhone()).isEqualTo("3009999999");
        Assertions.assertThat(updatedClient.getEmail()).isEqualTo("luis.nuevo@test.com");
        Assertions.assertThat(updatedClient.getName()).isEqualTo("Luis");
        Assertions.assertThat(updatedClient.getNationalId()).isEqualTo("1000000002");

        // Actualizar no crea otro cliente: siguen siendo los 3 de setUp.
        Assertions.assertThat(clientRepository.count()).isEqualTo(3);
    }

    // ---------- Eliminar (Delete) ----------

    @Test
    public void ClientRepository_deleteById_RemovesClient() {
        // arrange
        Integer index = sofia.getClientId();

        // act
        // flushAndClear envía el DELETE a la base de datos.
        clientRepository.deleteById(index);
        flushAndClear();

        // assert
        // Sofía ya no existe y los otros dos clientes siguen guardados.
        Assertions.assertThat(clientRepository.findById(index)).isEmpty();
        Assertions.assertThat(clientRepository.count()).isEqualTo(2);
        Assertions.assertThat(clientRepository.existsById(ana.getClientId())).isTrue();
        Assertions.assertThat(clientRepository.existsById(luis.getClientId())).isTrue();
    }

    @Test
    public void ClientRepository_deleteById_WrongIndexKeepsClients() {
        // arrange
        // Ningún cliente tiene un id negativo.
        Integer index = -1;

        // act
        // Borrar un id que no existe no lanza error ni borra a otros clientes.
        clientRepository.deleteById(index);
        flushAndClear();

        // assert
        Assertions.assertThat(clientRepository.count()).isEqualTo(3);
    }

    // ---------- Utilidades ----------

    /** Cliente nuevo, sin id, con datos válidos. La contraseña es la misma en todas las pruebas. */
    private Client newClient(String name, String lastName, String nationalId, String phone, String email) {
        return Client.builder()
                .name(name)
                .lastName(lastName)
                .nationalId(nationalId)
                .phone(phone)
                .email(email)
                .password("password123")
                .build();
    }

    /**
     * Envía a la base de datos los cambios pendientes y vacía la caché de JPA. Sin esto, JPA
     * devolvería el objeto que ya tiene en memoria y el INSERT, UPDATE o DELETE no llegaría a
     * ejecutarse antes de que la transacción se revierta.
     */
    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }
}
