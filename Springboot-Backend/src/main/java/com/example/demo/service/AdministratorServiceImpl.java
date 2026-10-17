package com.example.demo.service;

import com.example.demo.dto.AdministratorDTO;
import com.example.demo.dto.AdministratorListDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.service.interfaces.AdministratorService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Operaciones CRUD de administradores con persistencia en H2. */
@Service
@org.springframework.transaction.annotation.Transactional
public class AdministratorServiceImpl implements AdministratorService {

    @Autowired
    public AdministratorRepository administratorRepository;

    @Autowired
    public OperatorRepository operatorRepository;

    @Override
    public void create(Administrator administrator) {
        administrator.setAdminId(null);
        checkEmailIsFree(administrator.getEmail(), null);
        administratorRepository.save(administrator);
    }

    @Override
    public void delete(Integer adminId) {
        Administrator administrator = findById(adminId);

        // Cada operario necesita un administrador a cargo: el repositorio los cuenta y,
        // si hay alguno, primero hay que reasignarlos o borrarlos.
        long operators = operatorRepository.countByAdmin_AdminId(administrator.getAdminId());
        if (operators > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "\"" + administrator.getName() + "\" cannot be deleted because " + operators
                            + " operator(s) report to this administrator. Reassign or delete them first.");
        }

        administratorRepository.delete(administrator);
    }

    @Override
    public List<AdministratorListDTO> listAdministrators() {
        return administratorRepository.findAllForList();
    }

    @Override
    public List<AdministratorDTO> listOptions() {
        return administratorRepository.findAllForOptions();
    }

    @Override
    public AdministratorDTO findDetail(Integer adminId) {
        return AdministratorDTO.from(findById(adminId));
    }

    @Override
    public Administrator findById(Integer adminId) {
        return administratorRepository.findById(adminId)
                .get();
    }

    @Override
    public void update(Integer adminId, Administrator administrator) {
        Administrator registeredAdministrator = findById(adminId);

        checkEmailIsFree(administrator.getEmail(), registeredAdministrator.getAdminId());

        // Se conserva el id para que save() actualice la fila que ya existe en vez
        // de insertar una nueva, y la contraseña porque el CRUD REST no la modifica.
        administrator.setAdminId(registeredAdministrator.getAdminId());
        administrator.setPassword(registeredAdministrator.getPassword());

        administratorRepository.save(administrator);
    }

    @Override
    public AdministratorDTO login(String email, String password) {
        // La base de datos busca al administrador por su correo: no se descargan todos.
        // Se devuelve el DTO, así la contraseña no viaja de vuelta al navegador.
        return administratorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .filter(administrator -> administrator.getPassword().equals(password))
                .map(AdministratorDTO::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password."));
    }

    /**
     * Un correo solo puede ser de una cuenta del staff: se busca en administradores
     * (sin contar al que se edita) y en operarios. Antes lo revisaba el formulario
     * descargando las dos tablas completas.
     */
    private void checkEmailIsFree(String email, Integer adminId) {
        boolean usedByAdministrator = administratorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .filter(other -> !other.getAdminId().equals(adminId))
                .isPresent();
        boolean usedByOperator = operatorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .isPresent();
        if (usedByAdministrator || usedByOperator) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another staff account already uses this email.");
        }
    }

}
