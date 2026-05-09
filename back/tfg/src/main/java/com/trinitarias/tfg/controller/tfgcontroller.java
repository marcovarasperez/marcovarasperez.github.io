package com.trinitarias.tfg.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.trinitarias.tfg.dto.tfgdto;
import com.trinitarias.tfg.entity.tfgentity;
import com.trinitarias.tfg.service.tfgservice;

import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
@CrossOrigin(origins = "*")
public class tfgcontroller {

    @Autowired
    private tfgservice service;

    // ── REGISTRO ──────────────────────────────────────────────────────────────
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody tfgdto dto) {
        try {
            tfgentity nuevo = service.registrar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
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
    @PutMapping("/actualizar/{usuario}")
    public ResponseEntity<?> actualizarDatosJuego(@PathVariable String usuario, @RequestBody tfgdto dto) {
        try {
            return ResponseEntity.ok(service.actualizarDatosJuego(usuario, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
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