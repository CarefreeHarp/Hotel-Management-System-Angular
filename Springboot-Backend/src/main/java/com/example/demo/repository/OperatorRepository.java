package com.example.demo.repository;

import com.example.demo.dto.OperatorDTO;
import com.example.demo.entities.Operator;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * CAPA DE REPOSITORIO: acceso a la tabla OPERATOR con Spring Data JPA.
 *
 * La llave primaria es operator_id, de tipo Integer, y la genera la base de
 * datos con IDENTITY.
 *
 * Las consultas derivadas permiten contar operarios por administrador o buscar
 * por correo. Las de @Query arman los DTO de la tabla en la misma consulta.
 */
@Repository
public interface OperatorRepository extends JpaRepository<Operator, Integer> {

    /* Total de operarios de un administrador: un administrador con operarios no se borra. */
    long countByAdmin_AdminId(Integer adminId);

    /* Busca un operario por correo electrónico sin distinguir mayúsculas de minúsculas. */
    Optional<Operator> findByEmailIgnoreCase(String email);

    /*
     * 1. Relaciona cada operario con su administrador.
     * 2. Devuelve el DTO con id y nombre del administrador, ordenado por id de operario.
     */
    @Query("""
            SELECT new com.example.demo.dto.OperatorDTO(
                operator.operatorId,
                operator.name,
                operator.lastName,
                operator.email,
                admin.adminId,
                admin.name
            )
            FROM Operator operator
            JOIN operator.admin admin
            ORDER BY operator.operatorId
            """)
    List<OperatorDTO> findAllForList();

    /*
     * 1. Relaciona los operarios con su administrador y filtra por adminId.
     * 2. Devuelve sus DTO, ordenados por id de operario.
     */
    @Query("""
            SELECT new com.example.demo.dto.OperatorDTO(
                operator.operatorId,
                operator.name,
                operator.lastName,
                operator.email,
                admin.adminId,
                admin.name
            )
            FROM Operator operator
            JOIN operator.admin admin
            WHERE admin.adminId = :adminId
            ORDER BY operator.operatorId
            """)
    List<OperatorDTO> findAllForListByAdminId(@Param("adminId") Integer adminId);
}
