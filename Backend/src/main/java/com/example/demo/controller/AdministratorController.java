package com.example.demo.controller;

import com.example.demo.dto.AdministratorDTO;
import com.example.demo.dto.AdministratorListDTO;
import com.example.demo.entities.Administrator;
import com.example.demo.service.interfaces.AdministratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/administrators")
@CrossOrigin("http://localhost:4200")
public class AdministratorController {

    private final AdministratorService service;

    public AdministratorController(AdministratorService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar administradores", description = "Devuelve las filas de la tabla: id, nombre, correo y cuántos operarios tiene a cargo.")
    public List<AdministratorListDTO> listAdministrators() {
        return service.listAdministrators();
    }

    @GetMapping("/options")
    @Operation(summary = "Opciones de administradores", description = "Id, nombre y correo, para el selector del formulario de operarios.")
    public List<AdministratorDTO> listAdministratorOptions() {
        return service.listOptions();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un administrador", description = "Devuelve el id, el nombre y el correo; la contraseña no se envía.")
    public AdministratorDTO readAdministrator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear un administrador", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createAdministrator(@RequestBody Administrator administrator) {
        service.create(administrator);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un administrador", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene. Se conserva la contraseña existente; el campo password solo se utiliza al crear el registro.")
    public void updateAdministrator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
                           @RequestBody Administrator administrator) {
        service.update(id, administrator);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un administrador", description = "Elimina el registro. La respuesta exitosa no tiene cuerpo.")
    public void deleteAdministrator(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.delete(id);
    }

    @GetMapping("/login")
    @Operation(summary = "Iniciar sesión como administrador", description = "Recibe el correo y la contraseña como parámetros de la URL (?email=&password=) y devuelve el administrador; su id va en la URL del panel.")
    public AdministratorDTO login(@RequestParam String email, @RequestParam String password) {
        return service.login(email, password);
    }
}
