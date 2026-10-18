package com.example.demo.controller;

import com.example.demo.dto.ClientDetailDTO;
import com.example.demo.dto.ClientListDTO;
import com.example.demo.entities.Client;
import com.example.demo.service.interfaces.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import com.example.demo.validation.OnCreate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clients")
@CrossOrigin("http://localhost:4200")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Devuelve las filas de la tabla con solo las columnas que se muestran (sin foto ni contraseña).")
    public List<ClientListDTO> listClients() {
        return service.listClients();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un cliente", description = "Devuelve todos los atributos del cliente menos la contraseña.")
    public ClientDetailDTO readClient(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        return service.findDetail(id);
    }

    @PostMapping("")
    @Operation(summary = "Crear un cliente", description = "El servidor genera el identificador. La respuesta exitosa no tiene cuerpo.")
    public void createClient(@Validated(OnCreate.class) @RequestBody Client client) {
        service.register(client);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un cliente", description = "Reemplaza los campos editables. El identificador de la ruta se mantiene. Se conserva la contraseña existente; el campo password solo se utiliza al crear el registro.")
    public void updateClient(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id,
                           @Valid @RequestBody Client client) {
        service.updateProfile(id, client);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un cliente", description = "Elimina el registro. No se permite si el cliente tiene reservas. La respuesta exitosa no tiene cuerpo.")
    public void deleteClient(@Parameter(description = "Generated resource ID", example = "1") @PathVariable Integer id) {
        service.deleteProfile(id);
    }

    @GetMapping("/login")
    @Operation(summary = "Iniciar sesión como cliente", description = "Recibe el correo y la contraseña como parámetros de la URL (?email=&password=) y devuelve el cliente; su id va en la URL del perfil.")
    public ClientDetailDTO login(@RequestParam @NotBlank(message = "Enter your email address.") String email,
            @RequestParam @NotBlank(message = "Enter your password.") String password) {
        return service.login(email, password);
    }
}
