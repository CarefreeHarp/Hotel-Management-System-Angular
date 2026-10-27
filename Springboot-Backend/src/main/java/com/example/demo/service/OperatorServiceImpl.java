package com.example.demo.service;

import com.example.demo.dto.OperatorDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.entities.Operator;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.service.interfaces.OperatorService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD de operarios. Su administrador se resuelve desde el repositorio. */
@Service
@Transactional
public class OperatorServiceImpl implements OperatorService {

    private final OperatorRepository operatorRepository;

    private final AdministratorRepository administratorRepository;

    public OperatorServiceImpl(OperatorRepository operatorRepository, AdministratorRepository administratorRepository) {
        this.operatorRepository = operatorRepository;
        this.administratorRepository = administratorRepository;
    }

    @Override
    public List<OperatorDTO> listByAdministrator(Integer adminId) {
        return operatorRepository.findAllForListByAdminId(adminId);
    }

    @Override
    public void create(Operator operator, Integer adminId) {
        operator.setOperatorId(null);
        checkEmailIsFree(operator.getEmail(), null);
        operator.setAdmin(adminInCharge(adminId));
        operatorRepository.save(operator);
    }

    @Override
    public void delete(Integer operatorId) {
        operatorRepository.delete(findById(operatorId));
    }

    @Override
    public List<OperatorDTO> listOperators() {
        return operatorRepository.findAllForList();
    }

    @Override
    public OperatorDTO findDetail(Integer operatorId) {
        return OperatorDTO.from(findById(operatorId));
    }

    @Override
    public Operator findById(Integer operatorId) {
        return operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator not found."));
    }

    @Override
    public void update(Integer operatorId, Operator operator, Integer adminId) {
        Operator registeredOperator = findById(operatorId);

        checkEmailIsFree(operator.getEmail(), registeredOperator.getOperatorId());
        Administrator adminInCharge = adminInCharge(adminId);

        // Se conserva el id para que save() actualice la fila que ya existe en vez
        // de insertar una nueva, y la contraseña porque el CRUD REST no la modifica.
        operator.setOperatorId(registeredOperator.getOperatorId());
        operator.setPassword(registeredOperator.getPassword());
        operator.setAdmin(adminInCharge);

        operatorRepository.save(operator);
    }

    @Override
    public OperatorDTO login(String email, String password) {
        // Un correo inexistente o una contraseña incorrecta producen el mismo rechazo de acceso.
        Operator account = operatorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim()).orElse(null);
        if (account == null || !account.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        return OperatorDTO.from(account);
    }

    /**
     * Un correo solo puede ser de una cuenta del staff: se busca en operarios (sin
     * contar al que se edita) y en administradores. Antes lo revisaba el formulario
     * descargando las dos tablas completas.
     */
    private void checkEmailIsFree(String email, Integer operatorId) {
        String normalizedEmail = email == null ? "" : email.trim();
        Operator sameRole = operatorRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        boolean usedBySameRole = sameRole != null && !sameRole.getOperatorId().equals(operatorId);
        boolean usedByOtherRole = administratorRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (usedBySameRole || usedByOtherRole) {
            throw new FieldException(HttpStatus.CONFLICT, "email", "Another staff account already uses this email.");
        }
    }

    /** El administrador a cargo es un campo del formulario: si falta o ya no existe, el error va en ese campo. */
    private Administrator adminInCharge(Integer adminId) {
        if (adminId == null) {
            throw new FieldException(HttpStatus.BAD_REQUEST, "admin",
                    "Select the administrator in charge of this operator.");
        }
        return administratorRepository.findById(adminId)
                .orElseThrow(() -> new FieldException(HttpStatus.BAD_REQUEST, "admin",
                        "The selected administrator no longer exists."));
    }

}
