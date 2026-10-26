package com.example.demo.service;

import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Client;
import com.example.demo.entities.Administrator;
import com.example.demo.entities.Operator;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.entities.enums.RoomStatus;
import com.example.demo.repository.ClientRepository;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.repository.ServiceRepository;
import com.example.demo.service.interfaces.ReservationService;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Prueba las operaciones completas contra H2 en memoria, sin tocar el archivo de datos local. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:client-reservations;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN",
        "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF"
})
// Cada caso revierte sus datos al terminar y no afecta a los demás.
@Transactional
class ClientReservationTest {
    @Autowired private BookingService bookings;
    @Autowired private ReservationService reservations;
    @Autowired private ClientRepository clients;
    @Autowired private AdministratorRepository admins;
    @Autowired private OperatorRepository operators;
    @Autowired private RoomTypeRepository types;
    @Autowired private RoomRepository rooms;
    @Autowired private ServiceRepository services;
    @Autowired private PaymentRepository payments;
    @Autowired private EntityManager entityManager;
    @Autowired private WebApplicationContext webContext;

    private Client client;
    private RoomType type;
    private Room room;
    private Service breakfast;
    private Administrator paymentAdmin;
    private Operator operator;
    private final LocalDate arrival = LocalDate.now().plusDays(10);

    @BeforeEach
    void prepareCatalog() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        client = clients.save(Client.builder().name("Ana").lastName("Perez").nationalId("TEST" + unique)
                .phone("3001234567").email(unique + "@example.com").password("password123").build());
        type = types.save(RoomType.builder().name("Test " + unique).description("Test room")
                .nightlyPrice(money("150000")).maxCapacity(4).mainPhoto("https://example.com/room.jpg").build());
        // Los números del catálogo de demostración son menores a 9000.
        room = rooms.save(Room.builder().number(9999).floor(1).status(RoomStatus.AVAILABLE).roomType(type).build());
        breakfast = services.save(Service.builder().name("Breakfast " + unique).urlName("breakfast-" + unique)
                .description("Breakfast").price(money("50000")).category("Food")
                .mainImageUrl("https://example.com/breakfast.jpg").build());
    }

    @Test
    void reducingStayRefundsOnlyExcessAndKeepsOriginalPayment() {
        ReservationDetailDTO original = create(3, "300000", List.of());
        Integer id = original.reservation().getReservationId();
        Integer paymentId = original.payments().get(0).paymentId();
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertMoney("150000", changed.total());
        assertMoney("150000", changed.paidTotal());
        assertMoney("150000", changed.refundedTotal());
        assertMoney("0", changed.balance());
        assertEquals("MODIFICATION", changed.refunds().get(0).reason());
        assertEquals(ReservationStatus.CONFIRMED, changed.reservation().getStatus());
        assertEquals("PAID", changed.folioStatus());
        assertEquals(paymentId, changed.payments().get(0).paymentId());
        assertMoney("300000", payments.findById(paymentId).orElseThrow().getAmount());
    }

    @Test
    void repeatedEditAndCancellationDoNotRefundSameMoneyTwice() {
        Integer id = create(3, "450000", List.of()).reservation().getReservationId();
        reservations.updateClientReservation(id, client.getClientId(), draft(2, List.of()));
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertEquals(2, changed.refunds().size());
        assertMoney("300000", changed.refundedTotal());
        reservations.cancelReservation(id);
        reservations.cancelReservation(id);
        changed = reservations.readReservationDetails(id);
        assertEquals(3, changed.refunds().size());
        assertMoney("450000", changed.refundedTotal());
        assertMoney("0", changed.paidTotal());
        assertMoney("0", changed.balance());
        assertEquals(1, changed.payments().size());
    }

    @Test
    void exactPaidTotalNeedsNoRefundAndPriceIncreaseCreatesBalance() {
        Integer id = create(3, "300000", List.of()).reservation().getReservationId();
        reservations.updateClientReservation(id, client.getClientId(), draft(2, List.of()));
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertTrue(changed.refunds().isEmpty());
        assertEquals(ReservationStatus.CONFIRMED, changed.reservation().getStatus());
        reservations.updateClientReservation(id, client.getClientId(), draft(3, List.of()));
        changed = reservations.readReservationDetails(id);
        assertMoney("150000", changed.balance());
        assertEquals(ReservationStatus.PENDING, changed.reservation().getStatus());
    }

    @Test
    void removingServicesRefundsContractedPriceAndAddingUsesCurrentPrice() {
        Integer id = create(1, "200000", List.of(breakfast)).reservation().getReservationId();
        breakfast.setPrice(money("75000"));
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of(breakfast)));
        assertMoney("200000", reservations.readReservationDetails(id).total());
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertMoney("50000", changed.refundedTotal());
        assertMoney("150000", changed.total());
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of(breakfast)));
        changed = reservations.readReservationDetails(id);
        assertMoney("225000", changed.total());
        assertMoney("75000", changed.balance());
    }

    @Test
    void partialPaymentsAndSmallFinalBalanceCreateNewCardPayments() {
        Integer id = create(1, null, List.of(breakfast)).reservation().getReservationId();
        ReservationDetailDTO changed = reservations.addClientPayment(id, client.getClientId(), card("150000"));
        assertMoney("50000", changed.balance());
        assertEquals(ReservationStatus.PENDING, changed.reservation().getStatus());
        changed = reservations.addClientPayment(id, client.getClientId(), card("50000"));
        assertMoney("0", changed.balance());
        assertEquals(ReservationStatus.CONFIRMED, changed.reservation().getStatus());
        assertEquals("PAID", changed.folioStatus());
        assertEquals(2, changed.payments().size());
        // clear obliga a volver a leer de H2, en lugar de reutilizar los objetos que acabamos de guardar.
        entityManager.flush();
        entityManager.clear();
        for (Payment payment : payments.findByFolio_FolioIdOrderByPaidAtAsc(changed.folioId())) {
            assertEquals("CARD", payment.getPaymentMethod());
            assertNull(payment.getOperator());
            assertNull(payment.getCardholderName());
            assertNull(payment.getCardNumber());
            assertNull(payment.getExpiryDate());
            assertNull(payment.getSecurityCode());
        }
    }

    @Test
    void payingAfterRefundUsesNetPaidInsteadOfOriginalPayments() {
        Integer id = create(3, "450000", List.of()).reservation().getReservationId();
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        reservations.updateClientReservation(id, client.getClientId(), draft(2, List.of()));
        ReservationDetailDTO changed = reservations.addClientPayment(id, client.getClientId(), card("150000"));
        assertMoney("300000", changed.paidTotal());
        assertMoney("300000", changed.refundedTotal());
        assertMoney("0", changed.balance());
    }

    @Test
    void clientCannotOverrideRoomTypeStatusOrOwner() {
        Integer id = create(2, null, List.of()).reservation().getReservationId();
        Reservation input = draft(2, List.of());
        input.setGuestCount(3);
        input.setStatus(ReservationStatus.CANCELLED);
        input.setRoom(null);
        input.setClient(null);
        reservations.updateClientReservation(id, client.getClientId(), input);
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertEquals(3, changed.reservation().getGuestCount());
        assertEquals(type.getRoomTypeId(), changed.reservation().getRoomTypeId());
        assertEquals(client.getClientId(), changed.clientId());
        assertEquals(ReservationStatus.PENDING, changed.reservation().getStatus());
    }

    @Test
    void otherClientCannotEditOrPay() {
        Integer id = create(2, null, List.of()).reservation().getReservationId();
        assertThrows(ResponseStatusException.class,
                () -> reservations.updateClientReservation(id, -1, draft(1, List.of())));
        assertThrows(ResponseStatusException.class,
                () -> reservations.addClientPayment(id, -1, card("100000")));
    }

    @Test
    void cancelledReservationCannotBeEditedOrPaid() {
        Integer id = create(2, "100000", List.of()).reservation().getReservationId();
        reservations.cancelReservation(id);
        assertThrows(ResponseStatusException.class,
                () -> reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of())));
        assertThrows(ResponseStatusException.class,
                () -> reservations.addClientPayment(id, client.getClientId(), card("100000")));
    }

    @Test
    void paymentsRejectOverpaymentInvalidCardAndZero() {
        Integer id = create(1, "100000", List.of()).reservation().getReservationId();
        assertThrows(ResponseStatusException.class,
                () -> reservations.addClientPayment(id, client.getClientId(), card("50001")));
        Payment invalid = card("50000");
        invalid.setCardNumber("123");
        assertThrows(ResponseStatusException.class,
                () -> reservations.addClientPayment(id, client.getClientId(), invalid));
        assertThrows(ResponseStatusException.class,
                () -> reservations.addClientPayment(id, client.getClientId(), card("0")));
    }

    @Test
    void editRejectsCapacityAndUnavailableRoom() {
        Integer id = create(1, null, List.of()).reservation().getReservationId();
        Reservation overCapacity = draft(1, List.of());
        overCapacity.setGuestCount(5);
        assertThrows(ResponseStatusException.class,
                () -> reservations.updateClientReservation(id, client.getClientId(), overCapacity));
        // La segunda estancia empieza al salir la primera; solo la extensión causaría el cruce.
        Reservation next = draft(3, List.of());
        next.setCheckInDate(arrival.plusDays(1));
        next.setClient(client);
        next.setRoom(Room.builder().roomType(type).build());
        bookings.createReservation(next);
        assertThrows(ResponseStatusException.class,
                () -> reservations.updateClientReservation(id, client.getClientId(), draft(3, List.of())));
    }

    @Test
    void inactiveServiceCanBeRetainedButNotAddedToAnotherReservation() {
        Integer id = create(1, null, List.of(breakfast)).reservation().getReservationId();
        breakfast.setActivationStatus(ActivationStatus.INACTIVE);
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of(breakfast)));
        Reservation next = draft(3, List.of());
        next.setCheckInDate(arrival.plusDays(1));
        next.setClient(client);
        next.setRoom(Room.builder().roomType(type).build());
        Integer otherId = bookings.createReservation(next).reservation().getReservationId();
        Reservation input = draft(3, List.of(breakfast));
        input.setCheckInDate(arrival.plusDays(1));
        assertThrows(ResponseStatusException.class,
                () -> reservations.updateClientReservation(otherId, client.getClientId(), input));
    }

    @Test
    void clientEndpointsBindJsonAndReturnUpdatedBalance() throws Exception {
        Integer id = create(2, "100000", List.of()).reservation().getReservationId();
        MockMvc http = MockMvcBuilders.webAppContextSetup(webContext).build();
        // formatted sustituye los marcadores %s por las fechas de esta prueba.
        String edit = """
                {"checkInDate":"%s","checkOutDate":"%s","guestCount":3,"services":[],
                 "status":"CANCELLED","nightlyPrice":1}
                """.formatted(arrival, arrival.plusDays(1));
        http.perform(put("/reservations/{id}/client", id).param("clientId", client.getClientId().toString())
                .contentType(MediaType.APPLICATION_JSON).content(edit)).andExpect(status().isOk());
        String payment = """
                {"amount":50000,"cardholderName":"Ana Perez","cardNumber":"4111111111111111",
                 "expiryDate":"12/30","securityCode":"123","paymentMethod":"CASH","status":"REJECTED"}
                """;
        http.perform(post("/reservations/{id}/payments", id).param("clientId", client.getClientId().toString())
                .contentType(MediaType.APPLICATION_JSON).content(payment))
                .andExpect(status().isOk()).andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.reservation.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.payments[1].paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.payments[1].status").value("APPROVED"))
                .andExpect(jsonPath("$.payments[1].cardNumber").doesNotExist());
    }

    @Test
    void malformedStayAndCardReturnFieldErrors() throws Exception {
        Integer id = create(1, null, List.of()).reservation().getReservationId();
        MockMvc http = MockMvcBuilders.webAppContextSetup(webContext).build();
        http.perform(put("/reservations/{id}/client", id).param("clientId", client.getClientId().toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"guestCount\":0}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.guestCount").exists())
                .andExpect(jsonPath("$.fieldErrors.checkInDate").exists());
        http.perform(post("/reservations/{id}/payments", id).param("clientId", client.getClientId().toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":150000}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['initialPayment.cardNumber']").exists());
    }

    @Test
    void operatorCashAndClientCardPaymentsShareTheNetBalance() {
        operator = createOperator();
        Integer id = create(2, "100000", List.of()).reservation().getReservationId();
        ReservationDetailDTO changed = reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                Payment.builder().amount(money("150000")).paymentMethod("CARD").build());
        assertMoney("50000", changed.balance());
        assertEquals(ReservationStatus.PENDING, changed.reservation().getStatus());
        changed = reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                Payment.builder().amount(money("50000")).build());
        assertMoney("0", changed.balance());
        assertEquals(ReservationStatus.CONFIRMED, changed.reservation().getStatus());
        assertEquals("PAID", changed.folioStatus());
        assertEquals(3, changed.payments().size());
        assertEquals("CARD", changed.payments().get(0).paymentMethod());
        for (int i = 1; i < 3; i++) {
            assertEquals("CASH", changed.payments().get(i).paymentMethod());
            assertEquals("Luis Rivera", changed.payments().get(i).operatorName());
            assertEquals("APPROVED", changed.payments().get(i).status());
        }
    }

    @Test
    void cashPaymentsRejectInvalidAmountsAndUnknownOperators() {
        operator = createOperator();
        Integer id = create(1, null, List.of()).reservation().getReservationId();
        assertThrows(ResponseStatusException.class,
                () -> reservations.addOperatorCashPayment(id, -1, Payment.builder().amount(money("100000")).build()));
        for (String value : List.of("0", "100000.123", "150001")) {
            assertThrows(ResponseStatusException.class,
                    () -> reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                            Payment.builder().amount(money(value)).build()));
        }
        assertThrows(ResponseStatusException.class,
                () -> reservations.addOperatorCashPayment(id, operator.getOperatorId(), Payment.builder().build()));
        assertTrue(reservations.readReservationDetails(id).payments().isEmpty());
    }

    @Test
    void cancellationSplitsCashAndCardRefundsWithoutChangingPayments() {
        operator = createOperator();
        Integer id = create(2, "100000", List.of()).reservation().getReservationId();
        reservations.addOperatorCashPayment(id, operator.getOperatorId(), Payment.builder().amount(money("200000")).build());
        reservations.cancelReservation(id);
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertMoney("300000", changed.refundedTotal());
        assertMoney("0", changed.paidTotal());
        assertEquals(2, changed.refunds().size());
        assertEquals("CASH", changed.refunds().get(0).refundMethod());
        assertMoney("200000", changed.refunds().get(0).amount());
        assertEquals("CARD", changed.refunds().get(1).refundMethod());
        assertMoney("100000", changed.refunds().get(1).amount());
        assertEquals(2, changed.payments().size());
    }

    @Test
    void priceReductionRefundsCashBeforeCardAndLaterCancellationReturnsRest() {
        operator = createOperator();
        Integer id = create(3, "100000", List.of()).reservation().getReservationId();
        reservations.addOperatorCashPayment(id, operator.getOperatorId(), Payment.builder().amount(money("200000")).build());
        reservations.updateClientReservation(id, client.getClientId(), draft(1, List.of()));
        ReservationDetailDTO changed = reservations.readReservationDetails(id);
        assertMoney("150000", changed.refundedTotal());
        assertEquals("CASH", changed.refunds().get(0).refundMethod());
        assertMoney("150000", changed.refunds().get(0).amount());
        reservations.cancelReservation(id);
        changed = reservations.readReservationDetails(id);
        assertMoney("300000", changed.refundedTotal());
        assertMoney("0", changed.paidTotal());
        assertEquals("CASH", changed.refunds().get(1).refundMethod());
        assertMoney("50000", changed.refunds().get(1).amount());
        assertEquals("CARD", changed.refunds().get(2).refundMethod());
        assertMoney("100000", changed.refunds().get(2).amount());
    }

    @Test
    void cashEndpointForcesMethodAndOperatorAndReportsAmountErrors() throws Exception {
        operator = createOperator();
        Integer id = create(1, null, List.of()).reservation().getReservationId();
        MockMvc http = MockMvcBuilders.webAppContextSetup(webContext).build();
        String url = "/reservations/{id}/cash-payments";
        http.perform(post(url, id).param("operatorId", operator.getOperatorId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":150000,\"paymentMethod\":\"CARD\",\"status\":\"REJECTED\",\"operator\":{\"operatorId\":-1}}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.reservation.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.payments[0].paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.payments[0].status").value("APPROVED"))
                .andExpect(jsonPath("$.payments[0].operatorName").value("Luis Rivera"));
        http.perform(post(url, id).param("operatorId", operator.getOperatorId().toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":100000}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.amount").exists());
    }

    @Test
    // Los dos hilos necesitan transacciones propias y datos confirmados para competir por el mismo bloqueo.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void simultaneousPaymentsCannotChargeMoreThanBalance() throws Exception {
        operator = createOperator();
        Integer id = create(1, null, List.of()).reservation().getReservationId();
        // ExecutorService ejecuta ambas peticiones en paralelo. El cerrojo de arranque las libera juntas.
        ExecutorService workers = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Boolean> first = workers.submit(() -> attemptPayment(id, start));
            Future<Boolean> second = workers.submit(() -> attemptCashPayment(id, start));
            start.countDown();
            // Future.get espera el resultado, con un límite para detectar un bloqueo que no termina.
            int approved = (first.get(15, TimeUnit.SECONDS) ? 1 : 0) + (second.get(15, TimeUnit.SECONDS) ? 1 : 0);
            assertEquals(1, approved);
            ReservationDetailDTO changed = reservations.readReservationDetails(id);
            assertEquals(1, changed.payments().size());
            assertMoney("150000", changed.paidTotal());
            assertMoney("0", changed.balance());
        } finally {
            workers.shutdownNow();
            // Este caso confirma transacciones; se retira su catálogo para dejar limpias las demás pruebas.
            reservations.deleteReservation(id);
            rooms.deleteById(room.getRoomId());
            types.deleteById(type.getRoomTypeId());
            services.deleteById(breakfast.getServiceId());
            clients.deleteById(client.getClientId());
            operators.deleteById(operator.getOperatorId());
            admins.deleteById(paymentAdmin.getAdminId());
        }
    }

    private boolean attemptCashPayment(Integer id, CountDownLatch start) throws InterruptedException {
        start.await();
        try {
            reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                    Payment.builder().amount(money("150000")).build());
            return true;
        } catch (ResponseStatusException ex) {
            assertEquals(409, ex.getStatusCode().value());
            return false;
        }
    }

    private boolean attemptPayment(Integer id, CountDownLatch start) throws InterruptedException {
        start.await();
        try {
            reservations.addClientPayment(id, client.getClientId(), card("150000"));
            return true;
        } catch (ResponseStatusException ex) {
            assertEquals(409, ex.getStatusCode().value());
            return false;
        }
    }

    private ReservationDetailDTO create(int nights, String paid, List<Service> selected) {
        Reservation input = draft(nights, selected);
        input.setClient(client);
        input.setRoom(Room.builder().roomType(type).build());
        if (paid != null) input.setInitialPayment(card(paid));
        return bookings.createReservation(input);
    }

    private Reservation draft(int nights, List<Service> selected) {
        return Reservation.builder().checkInDate(arrival).checkOutDate(arrival.plusDays(nights))
                .guestCount(2).services(selected).build();
    }

    private Payment card(String amount) {
        return Payment.builder().amount(money(amount)).cardholderName("Ana Perez")
                .cardNumber("4111111111111111").expiryDate("12/30").securityCode("123").build();
    }

    private Operator createOperator() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        paymentAdmin = admins.save(Administrator.builder().name("Manager")
                .email("manager-" + unique + "@example.com").password("password123").build());
        return operators.save(Operator.builder().name("Luis").lastName("Rivera")
                .email("operator-" + unique + "@example.com").password("password123")
                .admin(paymentAdmin).build());
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private void assertMoney(String expected, BigDecimal actual) {
        // compareTo compara el importe: 150000 y 150000.00 representan el mismo dinero.
        assertEquals(0, money(expected).compareTo(actual));
    }
}
