package com.example.demo.repository;

import com.example.demo.dto.AdministratorDTO;
import com.example.demo.dto.AdministratorListDTO;
import com.example.demo.entities.Administrator;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/** Consultas y proyecciones de lectura de Administrator. */
@Repository
public interface AdministratorRepository extends JpaRepository<Administrator, Integer> {

    /* Busca un administrador por correo electrónico sin distinguir mayúsculas de minúsculas. */
    Optional<Administrator> findByEmailIgnoreCase(String email);

    /*
     * 1. Incluye cada administrador, aunque no tenga operarios.
     * 2. Agrupa sus filas y cuenta los operarios, o cero si no hay.
     * 3. Devuelve un DTO por administrador, ordenado por id.
     */
    @Query("""
            SELECT new com.example.demo.dto.AdministratorListDTO(
                admin.adminId,
                admin.name,
                admin.email,
                COUNT(operator)
            )
            FROM Administrator admin
            LEFT JOIN admin.operators operator
            GROUP BY admin.adminId, admin.name, admin.email
            ORDER BY admin.adminId
            """)
    List<AdministratorListDTO> findAllForList();

    // Datos para elegir un administrador.
    @Query("""
            SELECT new com.example.demo.dto.AdministratorDTO(
                admin.adminId,
                admin.name,
                admin.email
            )
            FROM Administrator admin
            ORDER BY admin.name
            """)
    List<AdministratorDTO> findAllForOptions();
}
