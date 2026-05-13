package com.trinitarias.tfg.validator;

import org.springframework.stereotype.Component;
import com.trinitarias.tfg.dto.tfgdto;

@Component
public class tfgvalidator {

    // ── USUARIO ───────────────────────────────────────────────────────────────
    public void validarUsuario(String usuario) {
        if (usuario == null || usuario.isBlank()) {
            throw new RuntimeException("El usuario no puede estar vacío");
        }
        if (usuario.length() < 3 || usuario.length() > 20) {
            throw new RuntimeException("El usuario debe tener entre 3 y 20 caracteres");
        }
        if (!usuario.matches("^[a-zA-Z0-9_]+$")) {
            throw new RuntimeException("El usuario solo puede contener letras, números y guiones bajos");
        }
    }

    // ── PASSWORD ──────────────────────────────────────────────────────────────
    public void validarPassword(String password) {
        if (password == null || password.isBlank()) {
            throw new RuntimeException("La contraseña no puede estar vacía");
        }
        if (password.length() < 8) {
            throw new RuntimeException("La contraseña debe tener al menos 8 caracteres");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("La contraseña debe contener al menos una mayúscula");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("La contraseña debe contener al menos un número");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new RuntimeException("La contraseña debe contener al menos un carácter especial");
        }
    }

    // ── EMAIL ─────────────────────────────────────────────────────────────────
    public void validarEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("El email no puede estar vacío");
        }
        if (!email.matches("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")) {
            throw new RuntimeException("El formato del email no es válido");
        }
    }

    // ── REGISTRO COMPLETO ─────────────────────────────────────────────────────
    public void validarRegistro(tfgdto dto) {
        validarUsuario(dto.getUsuario());
        validarPassword(dto.getPassword());
        validarEmail(dto.getEmail());
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    public void validarLogin(String usuario, String password) {
        validarUsuario(usuario);
        if (password == null || password.isBlank()) {
            throw new RuntimeException("La contraseña no puede estar vacía");
        }
    }
}