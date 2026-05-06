package com.trinitarias.resqbot_api_cliente.validator;

import com.trinitarias.resqbot_api_cliente.dto.UsuarioDto;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class UsuarioValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return UsuarioDto.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        UsuarioDto dto = (UsuarioDto) target;

        // Validar username
        if (dto.getUsername() == null || dto.getUsername().isBlank()) {
            errors.rejectValue("username", "username.empty", "El nombre de usuario no puede estar vacío");
            return;
        }
        if (dto.getUsername().length() < 3 || dto.getUsername().length() > 50) {
            errors.rejectValue("username", "username.size", "El usuario debe tener entre 3 y 50 caracteres");
        }
        if (!dto.getUsername().matches("^[a-zA-Z0-9_]+$")) {
            errors.rejectValue("username", "username.invalid", "El usuario solo puede contener letras, números y guiones bajos");
        }

        // Validar contraseña
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            errors.rejectValue("password", "password.empty", "La contraseña no puede estar vacía");
            return;
        }
        if (dto.getPassword().length() < 6) {
            errors.rejectValue("password", "password.size", "La contraseña debe tener al menos 6 caracteres");
        }
    }
}
