package com.example.demo.repository;

import com.example.demo.entities.Reservation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** Consultas de solo lectura. SQL de H2 permite agregar fechas y noches sin cargar entidades. */
public interface AccountingRepository extends Repository<Reservation, Integer> {
    interface StatusRow {
        String getStatus();
        long getReservations();
    }
    interface TrendRow {
        LocalDate getBucket();
        long getReservations();
    }
    interface RoomRow {
        String getName();
        long getReservations();
        long getNights();
    }
    interface ServiceRow {
        String getName();
        long getQuantity();
        BigDecimal getChargedValue();
    }
    interface StayRow {
        double getAverageNights();
        double getAverageGuests();
    }

    // Cada movimiento aprobado se suma una vez por su fecha, incluso si su reserva ya fue cancelada.
    @Query("""
            SELECT COALESCE(SUM(payment.amount), 0)
            FROM Payment payment
            WHERE payment.status = com.example.demo.entities.enums.PaymentStatus.APPROVED
              AND payment.paidAt >= :from
              AND payment.paidAt < :until
            """)
    BigDecimal sumApprovedPayments(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    // La devolución se atribuye a su fecha real, que puede diferir de la del pago y de la reserva.
    @Query("""
            SELECT COALESCE(SUM(refund.amount), 0)
            FROM Refund refund
            WHERE refund.status = com.example.demo.entities.enums.PaymentStatus.APPROVED
              AND refund.refundedAt >= :from
              AND refund.refundedAt < :until
            """)
    BigDecimal sumApprovedRefunds(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    /*
     * 1. Selecciona reservas creadas en el período y excluye canceladas.
     * 2. Calcula estancia y cargos históricos. Sin folio conserva el cálculo legado por servicios.
     * 3. Resta pagos aprobados y suma reembolsos aprobados de toda la vida del folio.
     * Las subconsultas separadas evitan multiplicar importes al combinar varias relaciones.
     * Cada saldo se limita a cero antes de sumar. Es saldo actual, no un cierre histórico.
     */
    @Query(value = """
            SELECT COALESCE(SUM(GREATEST(
                reservation.nightly_price * DATEDIFF('DAY', reservation.check_in_date, reservation.check_out_date)
                + CASE WHEN EXISTS (SELECT 1 FROM folio WHERE folio.reservation_id = reservation.reservation_id)
                    THEN COALESCE((
                        SELECT SUM(charge.unit_price * charge.quantity)
                        FROM folio_item charge
                        JOIN folio ON folio.folio_id = charge.folio_id
                        WHERE folio.reservation_id = reservation.reservation_id
                    ), 0)
                    ELSE COALESCE((
                        SELECT SUM(service.price)
                        FROM reservation_service selected_service
                        JOIN service ON service.service_id = selected_service.service_id
                        WHERE selected_service.reservation_id = reservation.reservation_id
                    ), 0)
                  END
                - COALESCE((
                    SELECT SUM(payment.amount)
                    FROM payment
                    JOIN folio ON folio.folio_id = payment.folio_id
                    WHERE folio.reservation_id = reservation.reservation_id
                      AND payment.status = 'APPROVED'
                ), 0)
                + COALESCE((
                    SELECT SUM(refund.amount)
                    FROM refund
                    JOIN folio ON folio.folio_id = refund.folio_id
                    WHERE folio.reservation_id = reservation.reservation_id
                      AND refund.status = 'APPROVED'
                ), 0), 0)), 0)
            FROM reservation
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
              AND reservation.status <> 'CANCELLED'
            """, nativeQuery = true)
    BigDecimal sumOutstandingBalances(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    // Cuenta pendientes, confirmadas y en curso por fecha de creación, no por estancia.
    @Query(value = """
            SELECT reservation.status AS status,
                   COUNT(*) AS reservations
            FROM reservation
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
              AND reservation.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            GROUP BY reservation.status
            ORDER BY reservation.status
            """, nativeQuery = true)
    List<StatusRow> countReservationsByStatus(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    /*
     * 1. Filtra por fecha de creación con límite superior exclusivo.
     * 2. Agrupa en H2 por mes calendario.
     * El inicio del primer bloque puede quedar antes de from, pero no incluye registros fuera del filtro.
     */
    @Query(value = """
            SELECT CAST(DATE_TRUNC('MONTH', reservation.created_at) AS DATE) AS bucket,
                   COUNT(*) AS reservations
            FROM reservation
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
            GROUP BY bucket
            ORDER BY bucket
            """, nativeQuery = true)
    List<TrendRow> countReservationTrend(@Param("from") LocalDateTime from,
            @Param("until") LocalDateTime until);

    /*
     * 1. Excluye canceladas y filtra la cohorte por creación.
     * 2. Agrupa por tipo y suma las noches completas contratadas, no solo las que caen en el período.
     * LEFT JOIN conserva reservas sin habitación como un grupo sin asignación.
     */
    @Query(value = """
            SELECT COALESCE(room_type.name, 'Unassigned room type') AS name,
                   COUNT(*) AS reservations,
                   SUM(DATEDIFF('DAY', reservation.check_in_date, reservation.check_out_date)) AS nights
            FROM reservation
            LEFT JOIN room ON room.room_id = reservation.room_id
            LEFT JOIN room_type ON room_type.room_type_id = room.room_type_id
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
              AND reservation.status <> 'CANCELLED'
            GROUP BY room_type.room_type_id, room_type.name
            ORDER BY reservations DESC, name
            """, nativeQuery = true)
    List<RoomRow> rankRoomTypes(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    /*
     * 1. Filtra reservas no canceladas creadas en el período y sus cargos con servicio.
     * 2. Agrupa por concepto contratado y suma cantidades y precios históricos, sin usar el catálogo actual.
     * No son cobros por servicio. Los pagos pertenecen al folio completo.
     */
    @Query(value = """
            SELECT charge.concept AS name,
                   SUM(charge.quantity) AS quantity,
                   SUM(charge.unit_price * charge.quantity) AS chargedValue
            FROM folio_item charge
            JOIN folio ON folio.folio_id = charge.folio_id
            JOIN reservation ON reservation.reservation_id = folio.reservation_id
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
              AND reservation.status <> 'CANCELLED'
              AND charge.service_id IS NOT NULL
            GROUP BY charge.concept
            ORDER BY quantity DESC, name
            """, nativeQuery = true)
    List<ServiceRow> rankServices(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

    // Promedios de estancias programadas de la cohorte, sin canceladas. No mide ocupación efectiva.
    @Query(value = """
            SELECT COALESCE(AVG(CAST(DATEDIFF('DAY', reservation.check_in_date, reservation.check_out_date) AS DOUBLE)), 0) AS averageNights,
                   COALESCE(AVG(CAST(reservation.guest_count AS DOUBLE)), 0) AS averageGuests
            FROM reservation
            WHERE reservation.created_at >= :from
              AND reservation.created_at < :until
              AND reservation.status <> 'CANCELLED'
            """, nativeQuery = true)
    StayRow summarizeStays(@Param("from") LocalDateTime from, @Param("until") LocalDateTime until);

}
