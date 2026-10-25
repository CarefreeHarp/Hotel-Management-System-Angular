package com.example.demo.service.interfaces;

import com.example.demo.dto.ReservationDTO;
import com.example.demo.dto.ReservationDetailDTO;
import com.example.demo.entities.Reservation;
import java.util.List;

/**
 * Contrato de consulta y administración de reservas existentes. Recibe la
 * entidad en edición y devuelve los modelos de lectura usados por las pantallas.
 */
public interface ReservationService {
    List<ReservationDTO> listReservations();

    List<ReservationDTO> listByClient(Integer clientId);

    ReservationDTO findDetail(Integer reservationId);

    int clearClient(Integer clientId);

    long countByRoom(Integer roomId);

    long countByService(Integer serviceId);

    /** Actualiza estancia, servicios y estado junto con el folio en una sola transacción. */
    void updateReservation(Integer reservationId, Reservation reservation);

    /** Cancela reserva y folio, reembolsa el pagado neto y conserva estancia, cargos y pagos. */
    void cancelReservation(Integer reservationId);

    /** Elimina una reserva después de retirar pagos, cargos y folio. */
    void deleteReservation(Integer reservationId);

    /** Devuelve el historial del cliente con cargos, pagos y saldo por reserva. */
    List<ReservationDetailDTO> listClientHistory(Integer clientId);

    /** Consulta la estancia y los detalles financieros de una reserva. */
    ReservationDetailDTO readReservationDetails(Integer reservationId);
}
