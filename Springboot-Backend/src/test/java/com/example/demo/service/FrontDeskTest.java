package com.example.demo.service;

import com.example.demo.dto.FrontDeskBoard;
import com.example.demo.dto.FrontDeskBoard.RoomToPrepare;
import com.example.demo.dto.FrontDeskBoard.Stay;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.entities.Client;
import com.example.demo.entities.Operator;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.entities.enums.RoomStatus;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.ClientRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.service.interfaces.FrontDeskService;
import com.example.demo.service.interfaces.ReservationService;
import com.example.demo.service.interfaces.RoomService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Tablero del operario contra H2 en memoria. Comparte la configuración y el contexto de ClientReservationTest. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:client-reservations;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN",
        "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF"
})
// Cada caso revierte sus datos al terminar. Los datos de demostración también aparecen en el tablero,
// por eso las pruebas buscan sus propias reservas y habitaciones en lugar de contar filas.
@Transactional
class FrontDeskTest {
    @Autowired private BookingService bookings;
    @Autowired private ReservationService reservations;
    @Autowired private RoomService roomService;
    @Autowired private FrontDeskService frontDesk;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private ClientRepository clients;
    @Autowired private AdministratorRepository admins;
    @Autowired private OperatorRepository operators;
    @Autowired private RoomTypeRepository types;
    @Autowired private RoomRepository rooms;
    @Autowired private WebApplicationContext webContext;

    private final LocalDate today = LocalDate.now();
    private String unique;
    private Client client;
    private RoomType type;

    @BeforeEach
    void prepareCatalog() {
        unique = UUID.randomUUID().toString().substring(0, 8);
        client = clients.save(Client.builder().name("Ana").lastName("Perez").nationalId("DESK" + unique)
                .phone("3001234567").email(unique + "@example.com").password("password123").build());
        type = types.save(RoomType.builder().name("Desk " + unique).description("Test room")
                .nightlyPrice(money("150000")).maxCapacity(4).mainPhoto("https://example.com/room.jpg").build());
    }

    @Test
    void boardGroupsTodayArrivalsGuestsDeparturesAndRoomsToPrepare() {
        Room arrivalRoom = room(9991, RoomStatus.AVAILABLE);
        Room lateRoom = room(9992, RoomStatus.CLEANING);
        Room stayingRoom = room(9993, RoomStatus.OCCUPIED);
        Room leavingRoom = room(9994, RoomStatus.OCCUPIED);
        Room repairRoom = room(9995, RoomStatus.MAINTENANCE);
        Room retiredRoom = room(9996, RoomStatus.CLEANING);
        retiredRoom.setActivationStatus(ActivationStatus.INACTIVE);
        Integer arrival = stay("A", arrivalRoom, today, today.plusDays(2), ReservationStatus.CONFIRMED);
        Integer late = stay("L", lateRoom, today.minusDays(1), today.plusDays(1), ReservationStatus.PENDING);
        Integer tomorrow = stay("T", arrivalRoom, today.plusDays(2), today.plusDays(3), ReservationStatus.CONFIRMED);
        Integer staying = stay("S", stayingRoom, today.minusDays(2), today.plusDays(1), ReservationStatus.CHECKED_IN);
        Integer leaving = stay("D", leavingRoom, today.minusDays(2), today, ReservationStatus.CHECKED_IN);
        Integer overdue = stay("O", repairRoom, today.minusDays(3), today.minusDays(1), ReservationStatus.CHECKED_IN);

        FrontDeskBoard board = frontDesk.readBoard();

        assertEquals(today, board.date());
        assertTrue(ids(board.arrivals()).containsAll(List.of(arrival, late)));
        assertFalse(ids(board.arrivals()).contains(tomorrow));
        assertTrue(ids(board.inHouse()).containsAll(List.of(staying, leaving, overdue)));
        assertTrue(ids(board.departures()).containsAll(List.of(leaving, overdue)));
        assertFalse(ids(board.departures()).contains(staying));
        Stay arrivalRow = find(board.arrivals(), arrival);
        assertEquals(9991, arrivalRow.roomNumber());
        assertEquals(RoomStatus.AVAILABLE, arrivalRow.roomStatus());
        // Sin folio, el saldo es la estancia completa: dos noches de COP 150.000.
        assertMoney("300000", arrivalRow.balance());
        assertEquals("Ana Perez", arrivalRow.guestName());

        List<Integer> roomIds = board.rooms().stream().map(RoomToPrepare::roomId).toList();
        assertTrue(roomIds.containsAll(List.of(lateRoom.getRoomId(), repairRoom.getRoomId())));
        assertFalse(roomIds.contains(retiredRoom.getRoomId()));
        assertFalse(roomIds.contains(arrivalRoom.getRoomId()));
        RoomToPrepare lateRow = board.rooms().get(roomIds.indexOf(lateRoom.getRoomId()));
        assertTrue(lateRow.arrivalExpected());
        assertFalse(board.rooms().get(roomIds.indexOf(repairRoom.getRoomId())).arrivalExpected());
        // Todas las habitaciones con una llegada esperada van antes que las demás.
        int lastExpected = -1;
        int firstWithoutArrival = board.rooms().size();
        for (int index = 0; index < board.rooms().size(); index++) {
            if (board.rooms().get(index).arrivalExpected()) lastExpected = index;
            else firstWithoutArrival = Math.min(firstWithoutArrival, index);
        }
        assertTrue(lastExpected < firstWithoutArrival);
    }

    @Test
    void checkInNeedsConfirmedStayAndReadyRoom() {
        Room room = room(9991, RoomStatus.CLEANING);
        Integer id = book(today, 2, "300000");
        assertEquals(ReservationStatus.CONFIRMED, reservationStatus(id));

        assertConflict("being cleaned", () -> reservations.checkIn(id));
        roomService.markReady(room.getRoomId());
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
        reservations.checkIn(id);
        assertEquals(ReservationStatus.CHECKED_IN, reservationStatus(id));
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        assertConflict("Only confirmed", () -> reservations.checkIn(id));

        Room second = room(9992, RoomStatus.AVAILABLE);
        Integer pending = book(today, 1, null);
        assertEquals(ReservationStatus.PENDING, reservationStatus(pending));
        assertConflict("pending", () -> reservations.checkIn(pending));
        Integer future = book(today.plusDays(1), 1, "150000");
        assertConflict("arrival date", () -> reservations.checkIn(future));
        second.setStatus(RoomStatus.MAINTENANCE);
        Integer maintenance = stay("M", second, today, today.plusDays(1), ReservationStatus.CONFIRMED);
        assertConflict("under maintenance", () -> reservations.checkIn(maintenance));
    }

    @Test
    void checkOutNeedsZeroBalanceAndLeavesRoomInCleaning() {
        Room room = room(9991, RoomStatus.AVAILABLE);
        Operator operator = createOperator();
        Integer id = book(today, 1, "100000");
        // El personal puede confirmar con saldo pendiente desde el formulario; el check-in no exige saldo cero.
        reservationRepository.findById(id).orElseThrow().setStatus(ReservationStatus.CONFIRMED);
        reservations.checkIn(id);

        assertConflict("outstanding balance", () -> reservations.checkOut(id));
        ReservationDetailDTO paid = reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                Payment.builder().amount(money("50000")).build());
        assertMoney("0", paid.balance());
        reservations.checkOut(id);
        assertEquals(ReservationStatus.CHECKED_OUT, reservationStatus(id));
        assertEquals(RoomStatus.CLEANING, room.getStatus());
        assertConflict("Only checked-in", () -> reservations.checkOut(id));

        roomService.markReady(room.getRoomId());
        assertEquals(RoomStatus.AVAILABLE, room.getStatus());
        assertConflict("not in cleaning or maintenance", () -> roomService.markReady(room.getRoomId()));
    }

    @Test
    void priceIncreaseDuringStayKeepsGuestCheckedIn() {
        Room room = room(9991, RoomStatus.AVAILABLE);
        Operator operator = createOperator();
        Integer id = book(today, 1, "150000");
        reservations.checkIn(id);

        // El personal alarga la estancia una noche: el saldo sube pero el huésped sigue alojado.
        reservations.updateReservation(id, Reservation.builder().checkInDate(today)
                .checkOutDate(today.plusDays(2)).guestCount(2).status(ReservationStatus.CHECKED_IN)
                .room(Room.builder().roomType(type).build()).build());
        assertEquals(ReservationStatus.CHECKED_IN, reservationStatus(id));
        assertTrue(ids(frontDesk.readBoard().inHouse()).contains(id));
        assertFalse(ids(frontDesk.readBoard().arrivals()).contains(id));

        assertConflict("outstanding balance", () -> reservations.checkOut(id));
        reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                Payment.builder().amount(money("150000")).build());
        assertEquals(ReservationStatus.CHECKED_IN, reservationStatus(id));
        reservations.checkOut(id);
        assertEquals(RoomStatus.CLEANING, room.getStatus());
    }

    @Test
    void inHouseGuestCanPayOnDepartureDayButEndedStayCannot() {
        Room leavingRoom = room(9991, RoomStatus.OCCUPIED);
        Room missedRoom = room(9992, RoomStatus.AVAILABLE);
        Operator operator = createOperator();
        Integer leaving = stay("D", leavingRoom, today.minusDays(1), today, ReservationStatus.CHECKED_IN);
        Integer missed = stay("N", missedRoom, today.minusDays(1), today, ReservationStatus.CONFIRMED);

        ReservationDetailDTO paid = reservations.addOperatorCashPayment(leaving, operator.getOperatorId(),
                Payment.builder().amount(money("150000")).build());
        assertMoney("0", paid.balance());
        reservations.checkOut(leaving);
        assertEquals(RoomStatus.CLEANING, leavingRoom.getStatus());
        assertConflict("Payments are only allowed", () -> reservations.addOperatorCashPayment(missed,
                operator.getOperatorId(), Payment.builder().amount(money("150000")).build()));
    }

    @Test
    void endingMaintenanceDuringStayReturnsRoomToGuestAndCheckOutKeepsMaintenance() {
        Room room = room(9991, RoomStatus.MAINTENANCE);
        Operator operator = createOperator();
        Integer id = stay("S", room, today.minusDays(1), today.plusDays(1), ReservationStatus.CHECKED_IN);
        roomService.markReady(room.getRoomId());
        assertEquals(RoomStatus.OCCUPIED, room.getStatus());
        // Si la habitación vuelve a mantenimiento, la salida no la pasa a limpieza.
        room.setStatus(RoomStatus.MAINTENANCE);
        reservations.addOperatorCashPayment(id, operator.getOperatorId(),
                Payment.builder().amount(money("300000")).build());
        reservations.checkOut(id);
        assertEquals(RoomStatus.MAINTENANCE, room.getStatus());
    }

    @Test
    void endpointsReturnBoardJsonAndConflictMessages() throws Exception {
        Room room = room(9991, RoomStatus.CLEANING);
        Integer id = stay("A", room, today, today.plusDays(1), ReservationStatus.CONFIRMED);
        MockMvc http = MockMvcBuilders.webAppContextSetup(webContext).build();
        http.perform(get("/front-desk")).andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(today.toString()))
                .andExpect(jsonPath("$.arrivals[?(@.reservationId == " + id + ")].roomStatus").value("CLEANING"))
                .andExpect(jsonPath("$.rooms[?(@.roomId == " + room.getRoomId() + ")].arrivalExpected").value(true));
        http.perform(put("/reservations/{id}/check-in", id)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "Room 9991 is being cleaned. Mark it as ready before checking in."));
        http.perform(put("/rooms/{id}/ready", room.getRoomId())).andExpect(status().isOk());
        http.perform(put("/reservations/{id}/check-in", id)).andExpect(status().isOk());
        assertEquals(ReservationStatus.CHECKED_IN, reservationStatus(id));
    }

    private Room room(int number, RoomStatus roomStatus) {
        // Los números del catálogo de demostración son menores a 9000.
        return rooms.save(Room.builder().number(number).floor(9).status(roomStatus).roomType(type).build());
    }

    /** Reserva con fechas libres, incluso pasadas: BookingService solo acepta llegadas desde hoy. */
    private Integer stay(String suffix, Room room, LocalDate checkIn, LocalDate checkOut, ReservationStatus status) {
        return reservationRepository.save(Reservation.builder().reservationCode("DESK-" + unique + "-" + suffix)
                .checkInDate(checkIn).checkOutDate(checkOut).guestCount(2).nightlyPrice(money("150000"))
                .status(status).createdAt(LocalDateTime.now()).client(client).room(room).build())
                .getReservationId();
    }

    /** Reserva creada como en el flujo del cliente; si se paga el total queda confirmada. */
    private Integer book(LocalDate checkIn, int nights, String paid) {
        Reservation input = Reservation.builder().checkInDate(checkIn).checkOutDate(checkIn.plusDays(nights))
                .guestCount(2).client(client).room(Room.builder().roomType(type).build()).build();
        if (paid != null) {
            input.setInitialPayment(Payment.builder().amount(money(paid)).cardholderName("Ana Perez")
                    .cardNumber("4111111111111111").expiryDate("12/30").securityCode("123").build());
        }
        return bookings.createReservation(input).reservation().getReservationId();
    }

    private ReservationStatus reservationStatus(Integer id) {
        return reservationRepository.findById(id).orElseThrow().getStatus();
    }

    private Operator createOperator() {
        Administrator admin = admins.save(Administrator.builder().name("Manager")
                .email("manager-" + unique + "@example.com").password("password123").build());
        return operators.save(Operator.builder().name("Luis").lastName("Rivera")
                .email("operator-" + unique + "@example.com").password("password123").admin(admin).build());
    }

    private static List<Integer> ids(List<Stay> stays) {
        return stays.stream().map(Stay::reservationId).toList();
    }

    private static Stay find(List<Stay> stays, Integer id) {
        return stays.stream().filter(stay -> stay.reservationId().equals(id)).findFirst().orElseThrow();
    }

    private static void assertConflict(String message, Executable action) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, action);
        assertEquals(409, error.getStatusCode().value());
        assertTrue(error.getReason().contains(message), error.getReason());
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, money(expected).compareTo(actual));
    }
}
