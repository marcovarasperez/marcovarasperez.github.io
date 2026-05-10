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
public void registrar(tfgdto dto) {
    System.out.println("Intentando registrar usuario: " + dto.getUsuario());

    if (repository.existsByUsuario(dto.getUsuario())) {
        throw new RuntimeException("CONFL_USER");
    }
    tfgentity nuevaEntidad = new tfgentity(
        dto.getUsuario(), 
        dto.getPassword(), 
        dto.getEmail()
    );

    // 3. Guardar (Hibernate se encargará de los valores por defecto)
    repository.save(nuevaEntidad);
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

        if (!repository.existsByUsuario(usuario)) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        if (repository.existsByEmail(emailNuevo)) {
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
        if (!repository.existsByUsuario(usuario)) {
            throw new RuntimeException("No se encontró ninguna cuenta con usuario: " + usuario);
        }
        repository.deleteByUsuario(usuario);
    }

    public void eliminarPorEmail(String email) {
        if (!repository.existsByEmail(email)) {
            throw new RuntimeException("No se encontró ninguna cuenta con email: " + email);
        }
        repository.deleteByEmail(email);
    }
}