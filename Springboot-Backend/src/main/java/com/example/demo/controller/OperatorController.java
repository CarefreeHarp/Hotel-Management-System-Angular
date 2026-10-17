package com.example.demo.controller;

import com.example.demo.dto.OperatorDTO;
import com.example.demo.entities.Operator;
import com.example.demo.service.interfaces.OperatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operators")
@CrossOrigin("http://localhost:4200")
public class OperatorController {

    private final OperatorService service;

    public OperatorController(OperatorService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar operadores", description = "Devuelve las filas de la tabla; del administrador a cargo solo llegan su id y su nombre.")
    public List<OperatorDTO> listOperators(@Parameter(description = "Optional administrator ID to filter assigned operators", example = "1") @RequestParam(required = false) Integer adminId) {
        return adminId == null ? service.listOperators() : service.listByAdministrator(adminId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un operador", description = "Devuelve los datos visibles del operador; la contraseña no se envía.")
    public OperatorDTO readOperator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear un operador", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createOperator(@RequestBody Operator operator) {
        service.create(operator, operator.getAdmin().getAdminId());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un operador", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene. Se conserva la contraseña existente; el campo password solo se utiliza al crear el registro. admin.adminId debe corresponder a un administrador existente.")
    public void updateOperator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
                           @RequestBody Operator operator) {
        service.update(id, operator, operator.getAdmin().getAdminId());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un operador", description = "Elimina el registro. La respuesta exitosa no tiene cuerpo.")
    public void deleteOperator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.delete(id);
    }

    @GetMapping("/login")
    @Operation(summary = "Iniciar sesión como operador", description = "Recibe el correo y la contraseña como parámetros de la URL (?email=&password=) y devuelve el operador.")
    public OperatorDTO login(@RequestParam String email, @RequestParam String password) {
        return service.login(email, password);
    }
}
