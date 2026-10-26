package com.example.demo;

import com.example.demo.entities.Administrator;
import com.example.demo.entities.Client;
import com.example.demo.entities.Folio;
import com.example.demo.entities.FolioItem;
import com.example.demo.entities.Operator;
import com.example.demo.entities.Payment;
import com.example.demo.entities.Rating;
import com.example.demo.entities.Refund;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.entities.RoomType;
import com.example.demo.entities.Service;
import com.example.demo.entities.enums.ActivationStatus;
import com.example.demo.entities.enums.FolioStatus;
import com.example.demo.entities.enums.PaymentStatus;
import com.example.demo.entities.enums.RefundReason;
import com.example.demo.entities.enums.ReservationStatus;
import com.example.demo.entities.enums.RoomStatus;
import com.example.demo.repository.ClientRepository;
import com.example.demo.repository.FolioRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.RoomTypeRepository;
import com.example.demo.repository.ServiceRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Transactional
public class DataLoader implements CommandLineRunner {

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private EntityManager entityManager;

    @Override
    public void run(String... args) throws Exception {

        // Tipos de habitación
        RoomType standardRoom = saveRoomType(
                "Standard Room",
                "A comfortable room with a queen bed, work desk and private bathroom.",
                new BigDecimal("250000"),
                2,
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304",
                List.of("https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
                        "https://images.unsplash.com/photo-1566665797739-1674de7a421a"));

        RoomType deluxeRoom = saveRoomType(
                "Deluxe Room",
                "A spacious room with a king bed, lounge area and panoramic city views.",
                new BigDecimal("360000"),
                2,
                "https://images.unsplash.com/photo-1590490360182-c33d57733427",
                List.of("https://images.unsplash.com/photo-1616486338812-3dadae4b4ace",
                        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0"));

        RoomType executiveRoom = saveRoomType(
                "Executive Room",
                "A refined room with a dedicated workspace, premium amenities and lounge access.",
                new BigDecimal("450000"),
                3,
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
                List.of("https://images.unsplash.com/photo-1618773928121-c32242e63f39",
                        "https://images.unsplash.com/photo-1595576508898-0ad5c879a061"));

        RoomType familySuite = saveRoomType(
                "Family Suite",
                "A two-room suite designed for families, with extra beds and a generous living area.",
                new BigDecimal("590000"),
                5,
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
                List.of("https://images.unsplash.com/photo-1564078516393-cf04bd966897",
                        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7"));

        RoomType presidentialSuite = saveRoomType(
                "Presidential Suite",
                "Our signature suite with a private terrace, jacuzzi and personalized guest service.",
                new BigDecimal("950000"),
                6,
                "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
                List.of("https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
                        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c"));

        // Clientes
        saveClient("Emma", "Thompson", "1001001001", "3001001001",
                "emma.thompson@example.com", "Emma2026!",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330");
        saveClient("Liam", "Anderson", "1001001002", "3001001002",
                "liam.anderson@example.com", "Liam2026!",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e");
        saveClient("Olivia", "Martinez", "1001001003", "3001001003",
                "olivia.martinez@example.com", "Olivia2026!",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb");
        saveClient("Noah", "Williams", "1001001004", "3001001004",
                "noah.williams@example.com", "Noah2026!",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d");
        saveClient("Ava", "Robinson", "1001001005", "3001001005",
                "ava.robinson@example.com", "Ava2026!",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9");
        saveClient("Ethan", "Walker", "1001001006", "3001001006",
                "ethan.walker@example.com", "Ethan2026!",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7");
        saveClient("Sophia", "Harris", "1001001007", "3001001007",
                "sophia.harris@example.com", "Sophia2026!",
                "https://images.unsplash.com/photo-1531123897727-8f129e1688ce");
        saveClient("Lucas", "Clark", "1001001008", "3001001008",
                "lucas.clark@example.com", "Lucas2026!",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d");
        saveClient("Mia", "Lewis", "1001001009", "3001001009",
                "mia.lewis@example.com", "Mia2026!",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1");
        saveClient("James", "Young", "1001001010", "3001001010",
                "james.young@example.com", "James2026!",
                "https://images.unsplash.com/photo-1507591064344-4c6ce005b128");

        // Habitaciones
        saveRoom(101, 1, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(102, 1, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(103, 1, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(104, 1, RoomStatus.AVAILABLE, familySuite);
        saveRoom(105, 1, RoomStatus.MAINTENANCE, presidentialSuite);
        saveRoom(106, 1, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(107, 1, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(108, 1, RoomStatus.OCCUPIED, executiveRoom);
        saveRoom(109, 1, RoomStatus.AVAILABLE, familySuite);
        saveRoom(110, 1, RoomStatus.AVAILABLE, presidentialSuite);

        // 202 y 204 tienen huéspedes alojados y la 207 se limpia tras una salida de hoy (tablero del operario).
        saveRoom(201, 2, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(202, 2, RoomStatus.OCCUPIED, deluxeRoom);
        saveRoom(203, 2, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(204, 2, RoomStatus.OCCUPIED, familySuite);
        saveRoom(205, 2, RoomStatus.MAINTENANCE, presidentialSuite);
        saveRoom(206, 2, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(207, 2, RoomStatus.CLEANING, deluxeRoom);
        saveRoom(208, 2, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(209, 2, RoomStatus.AVAILABLE, familySuite);
        saveRoom(210, 2, RoomStatus.AVAILABLE, presidentialSuite);

        saveRoom(301, 3, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(302, 3, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(303, 3, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(304, 3, RoomStatus.AVAILABLE, familySuite);
        saveRoom(305, 3, RoomStatus.MAINTENANCE, presidentialSuite);
        saveRoom(306, 3, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(307, 3, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(308, 3, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(309, 3, RoomStatus.AVAILABLE, familySuite);
        saveRoom(310, 3, RoomStatus.AVAILABLE, presidentialSuite);

        saveRoom(401, 4, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(402, 4, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(403, 4, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(404, 4, RoomStatus.AVAILABLE, familySuite);
        saveRoom(405, 4, RoomStatus.MAINTENANCE, presidentialSuite);
        saveRoom(406, 4, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(407, 4, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(408, 4, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(409, 4, RoomStatus.AVAILABLE, familySuite);
        saveRoom(410, 4, RoomStatus.AVAILABLE, presidentialSuite);

        saveRoom(501, 5, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(502, 5, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(503, 5, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(504, 5, RoomStatus.AVAILABLE, familySuite);
        saveRoom(505, 5, RoomStatus.MAINTENANCE, presidentialSuite);
        saveRoom(506, 5, RoomStatus.AVAILABLE, standardRoom);
        saveRoom(507, 5, RoomStatus.AVAILABLE, deluxeRoom);
        saveRoom(508, 5, RoomStatus.AVAILABLE, executiveRoom);
        saveRoom(509, 5, RoomStatus.AVAILABLE, familySuite);
        saveRoom(510, 5, RoomStatus.AVAILABLE, presidentialSuite);

        // Servicios
        saveService("High-speed Wi-Fi", "high-speed-wi-fi",
                "High-speed wireless internet throughout the hotel.", new BigDecimal("10000"),
                "Connectivity", ActivationStatus.ACTIVE, "Stay connected throughout your visit", "24 hours",
                "Available every day", "Entire hotel",
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853");

        saveService("Breakfast Buffet", "breakfast-buffet",
                "A generous breakfast buffet with local produce, fresh fruit and baked goods.",
                new BigDecimal("45000"),
                "Food and beverage", ActivationStatus.ACTIVE, "A fresh start prepared every morning",
                "6:30 AM - 10:30 AM",
                "Available every day", "Atlan Restaurant",
                "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666");

        saveService("Lunch Menu", "lunch-menu",
                "A seasonal lunch menu prepared with fresh regional ingredients.",
                new BigDecimal("55000"),
                "Food and beverage", ActivationStatus.ACTIVE, "Fresh flavors for the middle of your day",
                "12:00 PM - 3:00 PM",
                "Available every day", "Atlan Restaurant",
                "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f");

        saveService("Fine Dining", "fine-dining",
                "An elegant à la carte dinner featuring contemporary Colombian cuisine.",
                new BigDecimal("65000"),
                "Food and beverage", ActivationStatus.ACTIVE, "An evening designed to be remembered",
                "6:00 PM - 10:00 PM",
                "Available every day", "Atlan Restaurant",
                "https://images.unsplash.com/photo-1414235077428-338989a2e8c0");

        saveService("Room Service", "room-service",
                "Meals and beverages delivered directly to the comfort of your room.",
                new BigDecimal("15000"),
                "Room", ActivationStatus.ACTIVE, "Private dining whenever you need it", "24 hours",
                "Available every day", "Guest rooms",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791");

        saveService("Laundry Service", "laundry-service",
                "Professional washing, drying and ironing for personal garments.",
                new BigDecimal("30000"),
                "Laundry", ActivationStatus.ACTIVE, "Thoughtful care for every garment", "Delivery within 24 hours",
                "Available every day", "Front desk and guest rooms",
                "https://images.unsplash.com/photo-1545173168-9f1947eebb7f");

        saveService("Secure Parking", "secure-parking",
                "Monitored parking available for hotel guests.", new BigDecimal("25000"),
                "Transportation", ActivationStatus.ACTIVE, "Peace of mind from the moment you arrive", "24 hours",
                "Subject to availability", "Basement level",
                "https://images.unsplash.com/photo-1506521781263-d8422e82f27a");

        saveService("Swimming Pool", "swimming-pool",
                "Access to the hotel's temperature-controlled panoramic pool.", new BigDecimal("30000"),
                "Wellness", ActivationStatus.ACTIVE, "A quiet pause beside the water", "7:00 AM - 9:00 PM",
                "Available every day", "Third-floor terrace",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945");

        saveService("Fitness Center", "fitness-center",
                "A modern fitness center equipped for cardio and strength training.",
                new BigDecimal("20000"),
                "Wellness", ActivationStatus.ACTIVE, "Keep your energy moving every day", "5:00 AM - 11:00 PM",
                "Available every day", "Second floor",
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48");

        saveService("Signature Spa", "signature-spa",
                "A restorative wellness circuit with personalized spa treatments.",
                new BigDecimal("120000"),
                "Wellness", ActivationStatus.ACTIVE, "Relaxation in an exclusive setting", "90 minutes",
                "Reservation required", "Second-floor wellness area",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef");

        saveService("Sauna Session", "sauna-session",
                "A private sauna session designed to relax the body and clear the mind.",
                new BigDecimal("40000"),
                "Wellness", ActivationStatus.ACTIVE, "Restorative warmth and complete calm", "45 minutes",
                "Reservation required", "Second-floor wellness area",
                "https://images.unsplash.com/photo-1544161515-4ab6ce6db874");

        saveService("Private Jacuzzi", "private-jacuzzi",
                "One hour of private access to the hotel jacuzzi.", new BigDecimal("60000"),
                "Wellness", ActivationStatus.ACTIVE, "A peaceful moment reserved for you", "60 minutes",
                "Reservation required", "Second-floor wellness area",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461");

        saveService("Relaxing Massage", "relaxing-massage",
                "A full-body massage performed by an experienced wellness therapist.",
                new BigDecimal("150000"),
                "Wellness", ActivationStatus.ACTIVE, "Balance for body and mind", "60 minutes",
                "Reservation required", "Second-floor wellness area",
                "https://images.unsplash.com/photo-1519823551278-64ac92734fb1");

        saveService("Airport Transfer", "airport-transfer",
                "Private transportation between the hotel and the airport.", new BigDecimal("90000"),
                "Transportation", ActivationStatus.ACTIVE, "Arrivals and departures without stress", "By reservation",
                "Available every day", "Airport and hotel",
                "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2");

        saveService("In-room Minibar", "in-room-minibar",
                "A curated selection of drinks and snacks available in your room.",
                new BigDecimal("20000"),
                "Food and beverage", ActivationStatus.ACTIVE, "Small pleasures at any hour", "24 hours",
                "Available every day", "Guest rooms",
                "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd");

        saveService("Additional Housekeeping", "additional-housekeeping",
                "Additional room cleaning requested outside the regular housekeeping schedule.",
                new BigDecimal("25000"),
                "Room", ActivationStatus.ACTIVE, "Your space, refreshed whenever you need it", "By request",
                "Available every day", "Guest rooms",
                "https://images.unsplash.com/photo-1584132967334-10e028bd69f7");

        saveService("Luggage Storage", "luggage-storage",
                "Secure temporary luggage storage before check-in or after check-out.",
                new BigDecimal("15000"),
                "Guest services", ActivationStatus.ACTIVE, "Explore the city without carrying your bags", "24 hours",
                "Available every day", "Front desk",
                "https://images.unsplash.com/photo-1569154941061-e231b4725ef1");

        saveService("Wake-up Call", "wake-up-call",
                "A personalized telephone wake-up call at your requested time.", new BigDecimal("10000"),
                "Guest services", ActivationStatus.ACTIVE, "Begin every day right on time", "24 hours",
                "Available every day", "Front desk",
                "https://images.unsplash.com/photo-1501139083538-0139583c060f");

        saveService("Bicycle Rental", "bicycle-rental",
                "A city bicycle available for independent exploration throughout the day.",
                new BigDecimal("50000"),
                "Recreation", ActivationStatus.ACTIVE, "Discover the city at your own pace", "Full day",
                "Subject to availability", "Lobby",
                "https://images.unsplash.com/photo-1502744688674-c619d1586c9e");

        saveService("Guided City Tour", "guided-city-tour",
                "A guided visit to the city's most memorable landmarks and neighborhoods.",
                new BigDecimal("180000"),
                "Recreation", ActivationStatus.ACTIVE, "Stories and places waiting to be discovered", "Half day",
                "Reservation required", "Lobby",
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e");

        for (Service service : serviceRepository.findAll()) {
            if (service.getActivationStatus() == ActivationStatus.ACTIVE) {
                service.setDescription(buildDetailedDescription(service));
                service.setSecondaryImageUrls(new ArrayList<>(serviceGalleryImages()));
            }
        }

        List<Administrator> administrators = new ArrayList<>();
        List<Operator> operators = new ArrayList<>();
        for (int index = 0; index < 5; index++) {
            Administrator administrator = Administrator.builder()
                    .name("Administrator " + (index + 1))
                    .email("admin" + (index + 1) + "@atlansuites.com")
                    .password("Admin2026!")
                    .build();
            entityManager.persist(administrator);
            administrators.add(administrator);
        }
        entityManager.flush();

        for (int index = 0; index < 15; index++) {
            Operator operator = Operator.builder()
                    .name("Operator")
                    .lastName(String.format("%02d", index + 1))
                    .email("operator" + (index + 1) + "@atlansuites.com")
                    .password("Operator2026!")
                    .admin(administrators.get(index % administrators.size()))
                    .build();
            entityManager.persist(operator);
            operators.add(operator);
        }

        // Casos de demostración coherentes con el 18 de octubre de 2026.
        // Cada reserva tiene folio. Las confirmadas y estancias realizadas tienen pagos completos.
        Reservation emmaJuneStay = saveReservation("ATL-2026-0001", "emma.thompson@example.com", 101,
                LocalDate.of(2026, 6, 2), LocalDate.of(2026, 6, 5), 2, ReservationStatus.CHECKED_OUT,
                List.of("breakfast-buffet", "laundry-service"), new BigDecimal("825000"));
        saveReservation("ATL-2026-0002", "emma.thompson@example.com", 103,
                LocalDate.of(2026, 10, 11), LocalDate.of(2026, 10, 15), 2, ReservationStatus.CHECKED_OUT,
                List.of("breakfast-buffet", "signature-spa"), new BigDecimal("1965000"));
        saveReservation("ATL-2026-0003", "liam.anderson@example.com", 104,
                LocalDate.of(2027, 11, 20), LocalDate.of(2027, 11, 23), 4, ReservationStatus.CONFIRMED,
                List.of("airport-transfer"));
        saveReservation("ATL-2026-0004", "olivia.martinez@example.com", 107,
                LocalDate.of(2026, 10, 12), LocalDate.of(2026, 10, 14), 1, ReservationStatus.CHECKED_OUT,
                List.of("room-service"));
        saveReservation("ATL-2026-0005", "noah.williams@example.com", 102,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3), 2, ReservationStatus.CANCELLED,
                List.of());
        saveReservation("ATL-2026-0006", "ava.robinson@example.com", 201,
                LocalDate.of(2027, 12, 18), LocalDate.of(2027, 12, 22), 2, ReservationStatus.PENDING,
                List.of("secure-parking"));

        saveReservation("ATL-2026-0007", "emma.thompson@example.com", 108,
                LocalDate.of(2026, 10, 16), LocalDate.of(2026, 12, 1), 2, ReservationStatus.CHECKED_IN,
                List.of(), new BigDecimal("20700000"));
        saveReservation("ATL-2026-0008", "emma.thompson@example.com", 102,
                LocalDate.of(2027, 1, 10), LocalDate.of(2027, 1, 13), 2, ReservationStatus.CONFIRMED,
                List.of("airport-transfer", "breakfast-buffet"), new BigDecimal("1215000"));
        saveReservation("ATL-2026-0009", "emma.thompson@example.com", 104,
                LocalDate.of(2027, 3, 15), LocalDate.of(2027, 3, 19), 4, ReservationStatus.CONFIRMED,
                List.of("airport-transfer", "breakfast-buffet", "laundry-service", "signature-spa"),
                new BigDecimal("800000"), new BigDecimal("900000"), new BigDecimal("945000"));
        saveReservation("ATL-2026-0010", "emma.thompson@example.com", 106,
                LocalDate.of(2027, 4, 20), LocalDate.of(2027, 4, 23), 1, ReservationStatus.PENDING,
                List.of("secure-parking"));
        saveReservation("ATL-2026-0011", "emma.thompson@example.com", 108,
                LocalDate.of(2027, 6, 5), LocalDate.of(2027, 6, 9), 2, ReservationStatus.PENDING,
                List.of("signature-spa", "private-jacuzzi"), new BigDecimal("300000"));
        // Emma pagó un anticipo con tarjeta antes de cancelar; el reembolso se lo devuelve completo.
        Reservation emmaCancelled = saveReservation("ATL-2026-0012", "emma.thompson@example.com", 109,
                LocalDate.of(2027, 8, 10), LocalDate.of(2027, 8, 12), 4, ReservationStatus.CANCELLED,
                List.of(), new BigDecimal("300000"));
        Reservation emmaAugustStay = saveReservation("ATL-2026-0013", "emma.thompson@example.com", 101,
                LocalDate.of(2026, 8, 3), LocalDate.of(2026, 8, 6), 2, ReservationStatus.CHECKED_OUT,
                List.of("breakfast-buffet", "laundry-service"),
                new BigDecimal("200000"), new BigDecimal("300000"), new BigDecimal("325000"));

        // Dos estadías terminadas de Emma tienen calificación; ATL-2026-0002 queda sin calificar.
        saveRating(emmaJuneStay, 5, "Quiet room, spotless bathroom and a generous breakfast buffet.");
        saveRating(emmaAugustStay, 4, "Comfortable stay. The laundry service took longer than expected.");
        saveRefund(emmaCancelled, new BigDecimal("300000"), "CARD", RefundReason.CANCELLATION,
                LocalDateTime.of(2026, 10, 10, 15, 30), "Reservation cancelled by the guest. Deposit refunded in full.");

        // Tablero del operario: fechas relativas al día en que arranca la aplicación, para que
        // siempre haya llegadas, huéspedes alojados, salidas pendientes y una habitación en limpieza.
        LocalDate today = LocalDate.now();
        saveReservation("ATL-2026-0014", "liam.anderson@example.com", 203,
                today, today.plusDays(3), 2, ReservationStatus.CONFIRMED, List.of("breakfast-buffet"));
        saveReservation("ATL-2026-0015", "sophia.harris@example.com", 206,
                today, today.plusDays(2), 2, ReservationStatus.PENDING, List.of(), new BigDecimal("200000"));
        // Ethan dejó la 207 esta mañana. Lucas llega hoy y espera a que termine la limpieza.
        saveReservation("ATL-2026-0016", "ethan.walker@example.com", 207,
                today.minusDays(2), today, 1, ReservationStatus.CHECKED_OUT, List.of());
        saveReservation("ATL-2026-0017", "lucas.clark@example.com", 207,
                today, today.plusDays(1), 1, ReservationStatus.CONFIRMED, List.of());
        saveReservation("ATL-2026-0018", "mia.lewis@example.com", 202,
                today.minusDays(3), today, 2, ReservationStatus.CHECKED_IN, List.of("room-service"));
        // Se guarda pendiente para que no se completen sus pagos: los consumos dejan COP 50.000 por cobrar al salir.
        Reservation jamesStay = saveReservation("ATL-2026-0019", "james.young@example.com", 204,
                today.minusDays(2), today, 3, ReservationStatus.PENDING,
                List.of("laundry-service", "in-room-minibar"), new BigDecimal("1180000"));
        jamesStay.setStatus(ReservationStatus.CHECKED_IN);
    }

    /** Guarda un tipo de habitación creado mediante su builder. */
    private RoomType saveRoomType(String name, String description, BigDecimal nightlyPrice,
            Integer maxCapacity, String mainPhoto, List<String> secondaryPhotos) {
        return roomTypeRepository.save(RoomType.builder()
                .name(name)
                .description(description)
                .nightlyPrice(nightlyPrice)
                .maxCapacity(maxCapacity)
                .mainPhoto(mainPhoto)
                .secondaryPhotos(new ArrayList<>(secondaryPhotos))
                .build());
    }

    /** Guarda un cliente creado mediante su builder. */
    private void saveClient(String name, String lastName, String nationalId, String phone,
            String email, String password, String profilePhoto) {
        clientRepository.save(Client.builder()
                .name(name)
                .lastName(lastName)
                .nationalId(nationalId)
                .phone(phone)
                .email(email)
                .password(password)
                .profilePhoto(profilePhoto)
                .build());
    }

    /** Guarda una habitación creada mediante su builder. */
    private void saveRoom(Integer number, Integer floor, RoomStatus status, RoomType roomType) {
        roomRepository.save(Room.builder()
                .number(number)
                .floor(floor)
                .status(status)
                .roomType(roomType)
                .activationStatus(ActivationStatus.ACTIVE)
                .build());
    }

    /** Guarda una reserva con la tarifa vigente del tipo de habitación y sus servicios. */
    private Reservation saveReservation(String code, String clientEmail, Integer roomNumber, LocalDate checkIn,
            LocalDate checkOut, Integer guestCount, ReservationStatus status, List<String> serviceUrlNames,
            BigDecimal... paymentAmounts) {
        Room room = roomRepository.findByNumber(roomNumber).get();
        List<Service> services = new ArrayList<>();
        serviceUrlNames.forEach(urlName -> services.add(serviceRepository.findByUrlNameIgnoreCase(urlName).get()));
        LocalDate createdOn = checkIn.minusDays(14);
        if (createdOn.isAfter(LocalDate.of(2026, 10, 1)))
            createdOn = LocalDate.of(2026, 10, 1);
        Reservation reservation = reservationRepository.save(Reservation.builder()
                .reservationCode(code)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .guestCount(guestCount)
                .nightlyPrice(room.getRoomType().getNightlyPrice())
                .status(status)
                .createdAt(createdOn.atTime(10, 0))
                .client(clientRepository.findByEmailIgnoreCase(clientEmail).get())
                .room(room)
                .services(services)
                .build());
        saveReservationFolio(reservation, paymentAmounts);
        return reservation;
    }

    /** Guarda la calificación de una estadía terminada, hecha el día siguiente a la salida. */
    private void saveRating(Reservation reservation, Integer score, String comment) {
        entityManager.persist(Rating.builder()
                .reservation(reservation)
                .score(score)
                .comment(comment)
                .createdAt(reservation.getCheckOutDate().plusDays(1).atTime(9, 0))
                .build());
    }

    /** Guarda un reembolso aprobado sobre el folio de la reserva, pedido por el cliente (sin operador). */
    private void saveRefund(Reservation reservation, BigDecimal amount, String refundMethod, RefundReason reason,
            LocalDateTime refundedAt, String notes) {
        entityManager.persist(Refund.builder()
                .folio(folioRepository.findByReservation_ReservationId(reservation.getReservationId()).get())
                .amount(amount)
                .refundMethod(refundMethod)
                .reason(reason)
                .status(PaymentStatus.APPROVED)
                .notes(notes)
                .refundedAt(refundedAt)
                .build());
    }

    /** Crea folios y pagos de demostración conservando las cuotas explícitas y los precios contratados. */
    private void saveReservationFolio(Reservation reservation, BigDecimal[] paymentAmounts) {
        BigDecimal total = reservation.getNightlyPrice().multiply(BigDecimal.valueOf(
                ChronoUnit.DAYS.between(reservation.getCheckInDate(), reservation.getCheckOutDate())));
        for (Service service : reservation.getServices())
            total = total.add(service.getPrice());
        List<BigDecimal> installments = new ArrayList<>(List.of(paymentAmounts));
        BigDecimal paid = BigDecimal.ZERO;
        for (BigDecimal installment : installments) {
            paid = paid.add(installment);
        }
        // Los casos pagados completan su saldo sin sustituir las cuotas ya definidas.
        if (reservation.getStatus() != ReservationStatus.PENDING
                && reservation.getStatus() != ReservationStatus.CANCELLED && paid.compareTo(total) < 0) {
            installments.add(total.subtract(paid));
            paid = total;
        }
        FolioStatus status = reservation.getStatus() == ReservationStatus.CANCELLED ? FolioStatus.CANCELLED
                : paid.compareTo(total) == 0 ? FolioStatus.PAID : FolioStatus.PENDING;
        Folio folio = Folio.builder().reservation(reservation).status(status)
                .issuedAt(reservation.getCreatedAt()).build();
        entityManager.persist(folio);
        for (Service service : reservation.getServices()) {
            entityManager.persist(FolioItem.builder().folio(folio).service(service).concept(service.getName())
                    .unitPrice(service.getPrice()).quantity(1).chargedAt(reservation.getCreatedAt()).build());
        }
        for (int index = 0; index < installments.size(); index++) {
            entityManager.persist(Payment.builder().folio(folio).amount(installments.get(index))
                    .paymentMethod("CARD").status(PaymentStatus.APPROVED)
                    .paidAt(reservation.getCreatedAt().plusDays(index + 1)).build());
        }
    }

    /** Guarda un servicio creado mediante su builder. */
    private void saveService(String name, String urlName, String description, BigDecimal price,
            String category, ActivationStatus activationStatus, String summary, String duration,
            String availability, String location, String mainImageUrl) {
        serviceRepository.save(Service.builder()
                .name(name)
                .urlName(urlName)
                .description(description)
                .price(price)
                .category(category)
                .activationStatus(activationStatus)
                .summary(summary)
                .duration(duration)
                .availability(availability)
                .location(location)
                .mainImageUrl(mainImageUrl)
                .secondaryImageUrls(new ArrayList<>())
                .build());
    }

    /**
     * Amplía cada descripción de servicio para que la página de detalle tenga
     * contenido informativo.
     */
    private String buildDetailedDescription(Service service) {
        return service.getDescription()
                + "\n\nAtlan Suites designs this experience around a calm, attentive stay. "
                + service.getSummary()
                + " Our team prepares the service with the same care given to every guest request, "
                + "so the experience feels personal whether you are visiting for business, rest, or a special occasion."
                + "\n\nThe service is offered at " + service.getLocation() + " and is "
                + service.getAvailability().toLowerCase() + ". Its usual duration is "
                + service.getDuration()
                + ", and our concierge can help coordinate any details before or during your stay.";
    }

    /**
     * Devuelve tres imágenes complementarias para la galería de cada servicio
     * activo.
     */
    private List<String> serviceGalleryImages() {
        return List.of(
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa");
    }
}
