package com.example.demo.service;

import com.example.demo.dto.AdministratorDTO;
import com.example.demo.dto.AdministratorListDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.exception.FieldException;
import com.example.demo.repository.AdministratorRepository;
import com.example.demo.repository.OperatorRepository;
import com.example.demo.service.interfaces.AdministratorService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Operaciones CRUD de administradores con persistencia en H2. */
@Service
@Transactional
public class AdministratorServiceImpl implements AdministratorService {

    private final AdministratorRepository administratorRepository;

    private final OperatorRepository operatorRepository;

    public AdministratorServiceImpl(AdministratorRepository administratorRepository,
            OperatorRepository operatorRepository) {
        this.administratorRepository = administratorRepository;
        this.operatorRepository = operatorRepository;
    }

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrator not found."));
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
        // orElse(null) extrae el resultado de Optional y devuelve null cuando el correo no existe.
        Administrator account = administratorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElse(null);
        if (account == null || !account.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        return AdministratorDTO.from(account);
    }

    /**
     * Un correo solo puede ser de una cuenta del staff: se busca en administradores
     * (sin contar al que se edita) y en operarios. Antes lo revisaba el formulario
     * descargando las dos tablas completas.
     */
    private void checkEmailIsFree(String email, Integer adminId) {
        String normalizedEmail = email == null ? "" : email.trim();
        Administrator sameRole = administratorRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        boolean usedBySameRole = sameRole != null && !sameRole.getAdminId().equals(adminId);
        boolean usedByOtherRole = operatorRepository.findByEmailIgnoreCase(normalizedEmail).isPresent();
        if (usedBySameRole || usedByOtherRole) {
            throw new FieldException(HttpStatus.CONFLICT, "email", "Another staff account already uses this email.");
        }
    }

}
