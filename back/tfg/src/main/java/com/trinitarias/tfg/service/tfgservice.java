package com.trinitarias.tfg.service;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.trinitarias.tfg.dto.tfgdto;
import com.trinitarias.tfg.entity.tfgentity;
import com.trinitarias.tfg.repository.tfgrepository;
import com.trinitarias.tfg.validator.tfgvalidator;

import java.util.List;
import java.util.Optional;

@Service
public class tfgservice {

    @Autowired
    private tfgrepository repository;

    @Autowired
    private tfgvalidator validator;

    // ── REGISTRO ──────────────────────────────────────────────────────────────
    public tfgentity registrar(tfgdto dto) {
        validator.validarRegistro(dto);

        if (repository.countByUsuario(dto.getUsuario()) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el usuario: " + dto.getUsuario());
        }
        if (repository.countByEmail(dto.getEmail()) > 0) {
            throw new RuntimeException("Ya existe una cuenta con el email: " + dto.getEmail());
        }

        tfgentity nuevo = new tfgentity(
            dto.getUsuario(),
            BCrypt.hashpw(dto.getPassword(), BCrypt.gensalt(12)),
            dto.getEmail()
        );

        return repository.save(nuevo);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    public tfgentity login(String usuario, String password) {
        validator.validarLogin(usuario, password);

        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null || !BCrypt.checkpw(password, jugador.getPassword())) {
            throw new RuntimeException("Usuario o contraseña incorrectos");
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
    public tfgentity actualizarDatosJuego(String usuario, tfgdto dto) {
        tfgentity jugador = repository.findByUsuario(usuario);
        if (jugador == null) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }

        validator.validarDatosJuego(dto);

        jugador.setIdMapa(dto.getIdMapa());
        jugador.setX(dto.getX());
        jugador.setY(dto.getY());
        jugador.setBit(dto.getBit());
        jugador.setTiempoJuego(dto.getTiempoJuego());
        if (dto.getInterruptores() != null)        jugador.setInterruptores(dto.getInterruptores());
        if (dto.getVariables() != null)            jugador.setVariables(dto.getVariables());
        if (dto.getPersonajesId() != null)         jugador.setPersonajesId(dto.getPersonajesId());
        if (dto.getNivelPersonaje() != null)       jugador.setNivelPersonaje(dto.getNivelPersonaje());
        if (dto.getInventarioObjetos() != null)    jugador.setInventarioObjetos(dto.getInventarioObjetos());
        if (dto.getInventarioArmas() != null)      jugador.setInventarioArmas(dto.getInventarioArmas());
        if (dto.getInventarioArmaduras() != null)  jugador.setInventarioArmaduras(dto.getInventarioArmaduras());
        if (dto.getObjetosClave() != null)         jugador.setObjetosClave(dto.getObjetosClave());
        if (dto.getEquipoPersonaje() != null)      jugador.setEquipoPersonaje(dto.getEquipoPersonaje());
        if (dto.getHabilidadesPersonaje() != null) jugador.setHabilidadesPersonaje(dto.getHabilidadesPersonaje());

        return repository.save(jugador);
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