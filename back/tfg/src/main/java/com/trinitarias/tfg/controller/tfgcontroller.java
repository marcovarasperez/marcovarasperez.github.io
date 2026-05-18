package com.trinitarias.tfg.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.trinitarias.tfg.dto.tfgdto;
import com.trinitarias.tfg.entity.tfgentity;
import com.trinitarias.tfg.service.tfgservice;
import org.springframework.web.bind.annotation.RequestMethod;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class tfgcontroller {

    @Autowired
    private tfgservice service;

    // ── REGISTRO ──────────────────────────────────────────────────────────────
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody tfgdto dto) {
        try {
            service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cuenta creada. Revisa tu email para verificar la cuenta.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ── VERIFICAR EMAIL ───────────────────────────────────────────────────────
    @GetMapping("/verificar/{token}")
    public ResponseEntity<?> verificarEmail(@PathVariable String token) {
        try {
            service.verificarEmail(token);
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("https://marcovarasperez.github.io/cuenta-verificada.html?ok=true"))
                .build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("https://marcovarasperez.github.io/cuenta-verificada.html?ok=false"))
                .build();
        }
    }

    // ── REENVIAR VERIFICACION ─────────────────────────────────────────────────
    @PostMapping("/reenviar-verificacion/{usuario}")
    public ResponseEntity<?> reenviarVerificacion(@PathVariable String usuario) {
        try {
            service.reenviarVerificacion(usuario);
            return ResponseEntity.ok("Correo de verificación reenviado correctamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody tfgdto dto) {
        try {
            tfgentity jugador = service.login(dto.getUsuario(), dto.getPassword());
            return ResponseEntity.ok(jugador);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    // ── READ ──────────────────────────────────────────────────────────────────
    @GetMapping("/todos")
    public ResponseEntity<?> obtenerTodos() {
        try {
            List<tfgentity> jugadores = service.obtenerTodos();
            return ResponseEntity.ok(jugadores);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.obtenerPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuario}")
    public ResponseEntity<?> obtenerPorUsuario(@PathVariable String usuario) {
        try {
            return ResponseEntity.ok(service.obtenerPorUsuario(usuario));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> obtenerPorEmail(@PathVariable String email) {
        try {
            return ResponseEntity.ok(service.obtenerPorEmail(email));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    @PatchMapping("/actualizar/{usuario}/usuario")
    public ResponseEntity<?> actualizarUsuario(@PathVariable String usuario,
                                                @RequestParam String usuarioNuevo) {
        try {
            service.actualizarUsuario(usuario, usuarioNuevo);
            return ResponseEntity.ok("Usuario actualizado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PatchMapping("/actualizar/{usuario}/password")
    public ResponseEntity<?> actualizarPassword(@PathVariable String usuario,
                                                 @RequestParam String passwordActual,
                                                 @RequestParam String passwordNueva) {
        try {
            service.actualizarPassword(usuario, passwordActual, passwordNueva);
            return ResponseEntity.ok("Contraseña actualizada correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/actualizar/{usuario}/email")
    public ResponseEntity<?> actualizarEmail(@PathVariable String usuario,
                                              @RequestParam String emailNuevo) {
        try {
            service.actualizarEmail(usuario, emailNuevo);
            return ResponseEntity.ok("Email actualizado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // ── SLOTS DE GUARDADO ─────────────────────────────────────────────────────
    @PutMapping("/guardado/{usuario}/slot/{slot}")
    public ResponseEntity<?> guardarSlot(@PathVariable String usuario,
                                          @PathVariable int slot,
                                          @RequestBody String datos) {
        try {
            service.guardarSlot(usuario, slot, datos);
            return ResponseEntity.ok("Slot " + slot + " guardado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/guardado/{usuario}/slot/{slot}")
    public ResponseEntity<?> cargarSlot(@PathVariable String usuario,
                                         @PathVariable int slot) {
        try {
            String datos = service.cargarSlot(usuario, slot);
            // Parseamos el JSON string a objeto para que el cliente reciba { contenido, titulo, nivel... }
            Object datosObj = new ObjectMapper().readValue(datos, Object.class);
            return ResponseEntity.ok(datosObj);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al parsear datos del slot");
        }
    }

    @GetMapping("/guardado/{usuario}/slots")
    public ResponseEntity<?> listarSlots(@PathVariable String usuario) {
        try {
            return ResponseEntity.ok(service.listarSlots(usuario));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/guardado/{usuario}/slot/{slot}")
    public ResponseEntity<?> eliminarSlot(@PathVariable String usuario,
                                           @PathVariable int slot) {
        try {
            service.eliminarSlot(usuario, slot);
            return ResponseEntity.ok("Slot " + slot + " eliminado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    @DeleteMapping("/eliminar/id/{id}")
    public ResponseEntity<?> eliminarPorId(@PathVariable Long id) {
        try {
            service.eliminarPorId(id);
            return ResponseEntity.ok("Jugador eliminado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar/usuario/{usuario}")
    public ResponseEntity<?> eliminarPorUsuario(@PathVariable String usuario) {
        try {
            service.eliminarPorUsuario(usuario);
            return ResponseEntity.ok("Jugador eliminado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/eliminar/email/{email}")
    public ResponseEntity<?> eliminarPorEmail(@PathVariable String email) {
        try {
            service.eliminarPorEmail(email);
            return ResponseEntity.ok("Jugador eliminado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}