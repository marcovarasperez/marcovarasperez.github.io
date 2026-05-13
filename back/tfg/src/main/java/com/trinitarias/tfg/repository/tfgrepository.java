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