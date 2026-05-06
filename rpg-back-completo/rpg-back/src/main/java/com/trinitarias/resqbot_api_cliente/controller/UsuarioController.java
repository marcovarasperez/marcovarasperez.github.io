package com.trinitarias.resqbot_api_cliente.controller;

import com.trinitarias.resqbot_api_cliente.dto.UsuarioDto;
import com.trinitarias.resqbot_api_cliente.service.UsuarioService;
import com.trinitarias.resqbot_api_cliente.validator.UsuarioValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioValidator usuarioValidator;

    // POST /api/v1/usuario/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UsuarioDto dto, BindingResult result) {
        usuarioValidator.validate(dto, result);
        if (result.hasErrors()) {
            String error = result.getFieldError().getDefaultMessage();
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        try {
            UsuarioDto respuesta = usuarioService.register(dto);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/v1/usuario/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioDto dto) {
        try {
            UsuarioDto respuesta = usuarioService.login(dto);
            return ResponseEntity.ok(respuesta);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/v1/usuario/save  — guarda la partida del jugador
    @PostMapping("/save")
    public ResponseEntity<?> guardarPartida(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String saveData = body.get("saveData");
            if (saveData == null || saveData.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "saveData no puede estar vacío"));
            }
            usuarioService.guardarPartida(token, saveData);
            return ResponseEntity.ok(Map.of("mensaje", "Partida guardada correctamente"));
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/v1/usuario/save  — carga la partida del jugador
    @GetMapping("/save")
    public ResponseEntity<?> cargarPartida(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UsuarioDto respuesta = usuarioService.cargarPartida(token);
            return ResponseEntity.ok(respuesta);
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}
