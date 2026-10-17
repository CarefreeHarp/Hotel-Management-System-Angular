package com.example.demo.repository;
import com.example.demo.entities.Folio;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FolioRepository extends JpaRepository<Folio, Integer> {
    java.util.Optional<Folio> findByReservation_ReservationId(Integer id);
}
