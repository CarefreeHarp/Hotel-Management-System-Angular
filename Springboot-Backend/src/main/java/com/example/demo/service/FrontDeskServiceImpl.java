package com.example.demo.service;

import com.example.demo.dto.FrontDeskBoard.RoomToPrepare;
import com.example.demo.dto.FrontDeskBoard.Stay;
import com.example.demo.dto.FrontDeskBoard;
import com.example.demo.entities.Reservation;
import com.example.demo.entities.Room;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.service.interfaces.FrontDeskService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lee las cuatro listas del tablero en una misma lectura consistente. Son listas
 * cortas del día, así que cada saldo reutiliza el cálculo del detalle de la reserva.
 */
@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class FrontDeskServiceImpl implements FrontDeskService {
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final ReservationBillingService billingService;

    public FrontDeskServiceImpl(ReservationRepository reservationRepository, RoomRepository roomRepository,
            ReservationBillingService billingService) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.billingService = billingService;
    }

    @Override
    public FrontDeskBoard readBoard() {
        LocalDate today = LocalDate.now();
        List<Stay> arrivals = new ArrayList<>();
        Set<Integer> arrivalRooms = new HashSet<>();
        for (Reservation reservation : reservationRepository.findArrivals(today)) {
            arrivals.add(stay(reservation));
            if (reservation.getRoom() != null) {
                arrivalRooms.add(reservation.getRoom().getRoomId());
            }
        }
        List<Stay> inHouse = new ArrayList<>();
        List<Stay> departures = new ArrayList<>();
        for (Reservation reservation : reservationRepository.findInHouse()) {
            Stay stay = stay(reservation);
            inHouse.add(stay);
            // Una salida vencida sigue pendiente hasta registrar el check-out.
            if (!reservation.getCheckOutDate().isAfter(today)) {
                departures.add(stay);
            }
        }
        // Las habitaciones que esperan una llegada se preparan primero.
        List<RoomToPrepare> rooms = new ArrayList<>();
        List<RoomToPrepare> withoutArrival = new ArrayList<>();
        for (Room room : roomRepository.findToPrepare()) {
            boolean arrivalExpected = arrivalRooms.contains(room.getRoomId());
            RoomToPrepare row = new RoomToPrepare(room.getRoomId(), room.getNumber(), room.getFloor(),
                    room.getRoomType().getName(), room.getStatus(), arrivalExpected);
            if (arrivalExpected) {
                rooms.add(row);
            } else {
                withoutArrival.add(row);
            }
        }
        rooms.addAll(withoutArrival);
        return new FrontDeskBoard(today, arrivals, inHouse, departures, rooms);
    }

    private Stay stay(Reservation reservation) {
        Room room = reservation.getRoom();
        boolean hasClient = reservation.getClient() != null;
        return new Stay(reservation.getReservationId(), reservation.getReservationCode(),
                hasClient ? reservation.getClient().getClientId() : null,
                hasClient ? reservation.getClient().getName() + " " + reservation.getClient().getLastName() : null,
                reservation.getGuestCount(), reservation.getCheckInDate(), reservation.getCheckOutDate(),
                reservation.getStatus(),
                room == null ? null : room.getNumber(),
                room == null ? null : room.getRoomType().getName(),
                room == null ? null : room.getStatus(),
                billingService.detail(reservation).balance());
    }
}
