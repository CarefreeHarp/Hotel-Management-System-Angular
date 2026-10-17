package com.example.demo.service;

import com.example.demo.dto.OperatorDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.entities.Operator;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.service.interfaces.AdministratorService;
import com.example.demo.service.interfaces.OperatorService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Operaciones CRUD de operarios; su administrador se obtiene mediante AdministratorService. */
@Service
@org.springframework.transaction.annotation.Transactional
public class OperatorServiceImpl implements OperatorService {

    @Autowired
    public OperatorRepository operatorRepository;

    @Autowired
    public AdministratorRepository administratorRepository;

    @Autowired
    public AdministratorService administratorService;

    @Override
    public List<OperatorDTO> listByAdministrator(Integer adminId) {
        return operatorRepository.findAllForListByAdminId(adminId);
    }

    @Override
    public void create(Operator operator, Integer adminId) {
        operator.setOperatorId(null);
        checkEmailIsFree(operator.getEmail(), null);
        operator.setAdmin(administratorService.findById(adminId));
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
                .get();
    }

    @Override
    public void update(Integer operatorId, Operator operator, Integer adminId) {
        Operator registeredOperator = findById(operatorId);

        checkEmailIsFree(operator.getEmail(), registeredOperator.getOperatorId());
        Administrator adminInCharge = administratorService.findById(adminId);

        // Se conserva el id para que save() actualice la fila que ya existe en vez
        // de insertar una nueva, y la contraseña porque el CRUD REST no la modifica.
        operator.setOperatorId(registeredOperator.getOperatorId());
        operator.setPassword(registeredOperator.getPassword());
        operator.setAdmin(adminInCharge);

        operatorRepository.save(operator);
    }

    @Override
    public OperatorDTO login(String email, String password) {
        // La base de datos busca al operario por su correo: no se descargan todos.
        // Se devuelve el DTO, así la contraseña no viaja de vuelta al navegador.
        return operatorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .filter(operator -> operator.getPassword().equals(password))
                .map(OperatorDTO::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password."));
    }

    /**
     * Un correo solo puede ser de una cuenta del staff: se busca en operarios (sin
     * contar al que se edita) y en administradores. Antes lo revisaba el formulario
     * descargando las dos tablas completas.
     */
    private void checkEmailIsFree(String email, Integer operatorId) {
        boolean usedByOperator = operatorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .filter(other -> !other.getOperatorId().equals(operatorId))
                .isPresent();
        boolean usedByAdministrator = administratorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .isPresent();
        if (usedByOperator || usedByAdministrator) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another staff account already uses this email.");
        }
    }

}
