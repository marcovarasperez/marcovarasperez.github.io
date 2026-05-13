package com.trinitarias.tfg.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.trinitarias.tfg.entity.tfgentity;

@Repository
public interface tfgrepository extends JpaRepository<tfgentity, Long> {

    // ── READ ─────────────────────────────────────────────────────────────────
    @Query(value = "SELECT * FROM datos_jugador WHERE usuario = :usuario", nativeQuery = true)
    tfgentity findByUsuario(String usuario);

    @Query(value = "SELECT * FROM datos_jugador WHERE email = :email", nativeQuery = true)
    tfgentity findByEmail(String email);

    @Query(value = "SELECT * FROM datos_jugador WHERE id = :id", nativeQuery = true)
    tfgentity findById(long id);

    @Query(value = "SELECT * FROM datos_jugador WHERE token_verificacion = :token", nativeQuery = true)
    tfgentity findByTokenVerificacion(String token);

    // ── EXISTS ───────────────────────────────────────────────────────────────
    @Query(value = "SELECT COUNT(*) FROM datos_jugador WHERE usuario = :usuario", nativeQuery = true)
    int countByUsuario(String usuario);

    @Query(value = "SELECT COUNT(*) FROM datos_jugador WHERE email = :email", nativeQuery = true)
    int countByEmail(String email);

    // ── UPDATE ───────────────────────────────────────────────────────────────
    @Modifying
    @Transactional
    @Query(value = "UPDATE datos_jugador SET password = :password WHERE usuario = :usuario", nativeQuery = true)
    void updatePasswordByUsuario(String usuario, String password);

    @Modifying
    @Transactional
    @Query(value = "UPDATE datos_jugador SET email = :email WHERE usuario = :usuario", nativeQuery = true)
    void updateEmailByUsuario(String usuario, String email);

    @Modifying
    @Transactional
    @Query(value = "UPDATE datos_jugador SET usuario = :usuarioNuevo WHERE usuario = :usuarioActual", nativeQuery = true)
    void updateUsuarioByUsuario(String usuarioActual, String usuarioNuevo);

    @Modifying
    @Transactional
    @Query(value = "UPDATE datos_jugador SET verificado = true, token_verificacion = null WHERE token_verificacion = :token", nativeQuery = true)
    void verificarCuenta(String token);

    // ── DELETE ───────────────────────────────────────────────────────────────
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM datos_jugador WHERE usuario = :usuario", nativeQuery = true)
    void deleteByUsuario(String usuario);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM datos_jugador WHERE email = :email", nativeQuery = true)
    void deleteByEmail(String email);
}