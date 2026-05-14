package com.trinitarias.tfg.service;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.trinitarias.tfg.dto.tfgdto;
import com.trinitarias.tfg.entity.tfgentity;
import com.trinitarias.tfg.repository.tfgrepository;
import com.trinitarias.tfg.validator.tfgvalidator;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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

    // ── EMAIL HTML ────────────────────────────────────────────────────────────
    private void enviarEmailVerificacion(String emailDestino, String usuario, String token) {
        String enlace = "http://marcovarasperez.duckdns.org/api/jugadores/verificar/" + token;

        String html = "<!DOCTYPE html>" +
            "<html lang='es'><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<title>Verifica tu cuenta</title></head>" +
            "<body style='margin:0;padding:0;background:#05080f;font-family:Georgia,serif;'>" +

            // Wrapper
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#05080f;padding:40px 16px;'>" +
            "<tr><td align='center'>" +
            "<table width='100%' style='max-width:520px;' cellpadding='0' cellspacing='0'>" +

            // Cabecera dorada
            "<tr><td style='background:linear-gradient(135deg,#0d1020,#141830);border:1px solid rgba(201,168,76,0.35);border-radius:4px 4px 0 0;padding:32px 40px;text-align:center;'>" +
            "<div style='font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;opacity:0.75;margin-bottom:10px;'>Core Delta</div>" +
            "<div style='font-size:26px;font-weight:700;color:#f0d080;letter-spacing:2px;text-shadow:0 0 20px rgba(201,168,76,0.4);'>⚔ Verifica tu cuenta</div>" +
            "<div style='width:60px;height:1px;background:linear-gradient(to right,transparent,#c9a84c,transparent);margin:16px auto 0;'></div>" +
            "</td></tr>" +

            // Cuerpo
            "<tr><td style='background:#080c16;border-left:1px solid rgba(201,168,76,0.2);border-right:1px solid rgba(201,168,76,0.2);padding:36px 40px;'>" +

            "<p style='margin:0 0 8px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#9a8a6a;'>Hola, héroe</p>" +
            "<p style='margin:0 0 24px;font-size:22px;color:#f0d080;font-weight:600;'>" + usuario + "</p>" +

            "<p style='margin:0 0 20px;font-size:15px;line-height:1.7;color:#b8a88a;'>" +
            "Tu aventura en <strong style='color:#f0d080;'>Core Delta</strong> está a punto de comenzar. " +
            "Solo necesitas un paso más: verificar tu dirección de correo electrónico." +
            "</p>" +

            "<p style='margin:0 0 28px;font-size:15px;line-height:1.7;color:#b8a88a;'>" +
            "Haz clic en el botón para activar tu cuenta:" +
            "</p>" +

            // Botón
            "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding-bottom:32px;'>" +
            "<a href='" + enlace + "' style='display:inline-block;padding:14px 40px;" +
            "background:linear-gradient(135deg,#b8922a,#c9a84c,#b8922a);" +
            "color:#0d0d0d;font-family:Georgia,serif;font-size:13px;font-weight:700;" +
            "letter-spacing:3px;text-transform:uppercase;text-decoration:none;" +
            "border-radius:2px;box-shadow:0 4px 20px rgba(201,168,76,0.3);'>" +
            "✦ &nbsp; Verificar mi cuenta" +
            "</a>" +
            "</td></tr></table>" +

            // Separador
            "<div style='width:100%;height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.25),transparent);margin-bottom:28px;'></div>" +

            "<p style='margin:0 0 12px;font-size:13px;line-height:1.6;color:#6a5a4a;'>" +
            "Si el botón no funciona, copia y pega este enlace en tu navegador:" +
            "</p>" +
            "<p style='margin:0 0 28px;font-size:12px;word-break:break-all;" +
            "color:#c9a84c;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);" +
            "border-radius:2px;padding:10px 14px;'>" +
            enlace +
            "</p>" +

            "<p style='margin:0;font-size:13px;line-height:1.6;color:#6a5a4a;font-style:italic;'>" +
            "Si no has creado una cuenta en Core Delta, puedes ignorar este correo con total seguridad." +
            "</p>" +

            "</td></tr>" +

            // Pie
            "<tr><td style='background:#050810;border:1px solid rgba(201,168,76,0.15);border-top:none;" +
            "border-radius:0 0 4px 4px;padding:20px 40px;text-align:center;'>" +
            "<p style='margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4a3a2a;'>" +
            "Core Delta &nbsp;·&nbsp; Crónicas del Héroe" +
            "</p>" +
            "<p style='margin:0;font-size:11px;color:#3a2a1a;'>" +
            "Este es un correo automático, por favor no respondas a este mensaje." +
            "</p>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(emailRemitente);
            helper.setTo(emailDestino);
            helper.setSubject("⚔ Verifica tu cuenta en Core Delta");
            helper.setText(html, true); // true = es HTML
            mailSender.send(mensaje);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo de verificación", e);
        }
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

    // ── REENVIAR VERIFICACION ─────────────────────────────────────────────────
    public void reenviarVerificacion(String usuario) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        if (jugador.isVerificado()) {
            throw new RuntimeException("Esta cuenta ya está verificada");
        }

        String nuevoToken = UUID.randomUUID().toString();
        jugador.setTokenVerificacion(nuevoToken);
        repository.save(jugador);

        enviarEmailVerificacion(jugador.getEmail(), jugador.getUsuario(), nuevoToken);
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