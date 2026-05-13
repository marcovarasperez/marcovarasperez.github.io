package com.trinitarias.tfg.service;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.trinitarias.tfg.dto.tfgdto;
import com.trinitarias.tfg.entity.tfgentity;
import com.trinitarias.tfg.repository.tfgrepository;
import com.trinitarias.tfg.validator.tfgvalidator;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class tfgservice {

    @Autowired
    private tfgrepository repository;

    @Autowired
    private tfgvalidator validator;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String emailRemitente;

    // ── EMAIL ─────────────────────────────────────────────────────────────────
    private void enviarEmailVerificacion(String emailDestino, String usuario, String token) {
        String enlace = "http://marcovarasperez.duckdns.org/api/jugadores/verificar/" + token;

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(emailRemitente);
        mensaje.setTo(emailDestino);
        mensaje.setSubject("Verifica tu cuenta");
        mensaje.setText(
            "Hola " + usuario + ",\n\n" +
            "Gracias por registrarte. Haz clic en el siguiente enlace para verificar tu cuenta:\n\n" +
            enlace + "\n\n" +
            "Si no has creado una cuenta, ignora este correo.\n\n" +
            "Un saludo."
        );

        mailSender.send(mensaje);
    }

    // ── REGISTRO ──────────────────────────────────────────────────────────────
    public tfgentity registrar(tfgdto dto) {
        validator.validarRegistro(dto);

        if (repository.countByUsuario(dto.getUsuario()) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el usuario: " + dto.getUsuario());
        }
        if (repository.countByEmail(dto.getEmail()) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el email: " + dto.getEmail());
        }

        String token = UUID.randomUUID().toString();

        tfgentity nuevo = new tfgentity(
            dto.getUsuario(),
            BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt(12)),
            dto.getEmail()
        );
        nuevo.setVerificado(false);
        nuevo.setTokenVerificacion(token);

        tfgentity guardado = repository.save(nuevo);
        enviarEmailVerificacion(dto.getEmail(), dto.getUsuario(), token);

        return guardado;
    }

    // ── VERIFICAR EMAIL ───────────────────────────────────────────────────────
    public void verificarEmail(String token) {
        tfgentity jugador = repository.findByTokenVerificacion(token);
        if (jugador == null) {
            throw new RuntimeException("Token de verificación inválido o ya utilizado");
        }
        repository.verificarCuenta(token);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    public tfgentity login(String usuario, String password) {
        validator.validarLogin(usuario, password);

        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null || !BCrypt.checkpw(password, jugador.getPassword())) {
            throw new RuntimeException("Usuario o contraseña incorrectos");
        }
        if (!jugador.isVerificado()) {
            throw new RuntimeException("Debes verificar tu email antes de iniciar sesión");
        }

        return jugador;
    }

    // ── READ ──────────────────────────────────────────────────────────────────
    public List<tfgentity> obtenerTodos() {
        return repository.findAll();
    }

    public tfgentity obtenerPorId(Long id) {
        Optional<tfgentity> jugador = repository.findById(id);
        if (jugador.isEmpty()) {
            throw new RuntimeException("No se encontró ninguna cuenta con id: " + id);
        }
        return jugador.get();
    }

    public tfgentity obtenerPorUsuario(String usuario) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        return jugador;
    }

    public tfgentity obtenerPorEmail(String email) {
        tfgentity jugador = repository.findByEmail(email);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con email: " + email);
        }
        return jugador;
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    public void actualizarUsuario(String usuarioActual, String usuarioNuevo) {
        validator.validarUsuario(usuarioNuevo);

        if (repository.countByUsuario(usuarioActual) == 0) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuarioActual);
        }
        if (repository.countByUsuario(usuarioNuevo) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el usuario: " + usuarioNuevo);
        }

        repository.updateUsuarioByUsuario(usuarioActual, usuarioNuevo);
    }

    public void actualizarPassword(String usuario, String passwordActual, String passwordNueva) {
        validator.validarPassword(passwordNueva);

        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        if (!BCrypt.checkpw(passwordActual, jugador.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        repository.updatePasswordByUsuario(usuario, BCrypt.hashpw(passwordNueva, BCrypt.gensalt(12)));
    }

    public void actualizarEmail(String usuario, String emailNuevo) {
        validator.validarEmail(emailNuevo);

        if (repository.countByUsuario(usuario) == 0) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        if (repository.countByEmail(emailNuevo) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el email: " + emailNuevo);
        }

        repository.updateEmailByUsuario(usuario, emailNuevo);
    }

    // ── SLOTS DE GUARDADO ─────────────────────────────────────────────────────
    public void guardarSlot(String usuario, int slot, String datos) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        jugador.getSlotsGuardado().put(slot, datos);
        repository.save(jugador);
    }

    public String cargarSlot(String usuario, int slot) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        String datos = jugador.getSlotsGuardado().get(slot);
        if (datos == null) {
            throw new RuntimeException("No hay datos en el slot: " + slot);
        }
        return datos;
    }

    public Set<Integer> listarSlots(String usuario) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        return jugador.getSlotsGuardado().keySet();
    }

    public void eliminarSlot(String usuario, int slot) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        if (!jugador.getSlotsGuardado().containsKey(slot)) {
            throw new RuntimeException("No hay datos en el slot: " + slot);
        }
        jugador.getSlotsGuardado().remove(slot);
        repository.save(jugador);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    public void eliminarPorId(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("No se encontró ninguna cuenta con id: " + id);
        }
        repository.deleteById(id);
    }

    public void eliminarPorUsuario(String usuario) {
        if (repository.countByUsuario(usuario) == 0) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        repository.deleteByUsuario(usuario);
    }

    public void eliminarPorEmail(String email) {
        if (repository.countByEmail(email) == 0) {
            throw new RuntimeException("No se encontró ninguna cuenta con email: " + email);
        }
        repository.deleteByEmail(email);
    }
}