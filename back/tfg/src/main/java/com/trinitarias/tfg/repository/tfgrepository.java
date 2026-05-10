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
    @Query(value = "SELECT * FROM DatosJugador WHERE usuario = :usuario AND password = :password", nativeQuery = true)
    public tfgentity findByUsuarioAndPassword(String usuario, String password);

    @Query(value = "SELECT * FROM DatosJugador WHERE usuario = :usuario", nativeQuery = true)
    public tfgentity findByUsuario(String usuario);

    @Query(value = "SELECT * FROM DatosJugador WHERE email = :email", nativeQuery = true)
    public tfgentity findByEmail(String email);

    @Query(value = "SELECT * FROM DatosJugador WHERE id = :id", nativeQuery = true)
    public tfgentity findById(long id);

    // Heredado de JpaRepository:
    // findAll()                     → SELECT * FROM DatosJugador
    // findAllById(Iterable<Long>)   → SELECT * WHERE id IN (...)
    // count()                       → SELECT COUNT(*) FROM DatosJugador

    // ── EXISTS ───────────────────────────────────────────────────────────────
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END FROM DatosJugador WHERE usuario = :usuario", nativeQuery = true)
boolean existsByUsuario(String usuario);

@Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END FROM DatosJugador WHERE email = :email", nativeQuery = true)
boolean existsByEmail(String email);

    // Heredado de JpaRepository:
    // existsById(Long id)           → SELECT COUNT(*) WHERE id = ?

    // ── UPDATE ───────────────────────────────────────────────────────────────
    @Modifying
    @Transactional
    @Query(value = "UPDATE DatosJugador SET password = :password WHERE usuario = :usuario", nativeQuery = true)
    void updatePasswordByUsuario(String usuario, String password);

    @Modifying
    @Transactional
    @Query(value = "UPDATE DatosJugador SET email = :email WHERE usuario = :usuario", nativeQuery = true)
    void updateEmailByUsuario(String usuario, String email);

    // ── DELETE ───────────────────────────────────────────────────────────────
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM DatosJugador WHERE usuario = :usuario", nativeQuery = true)
    void deleteByUsuario(String usuario);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM DatosJugador WHERE email = :email", nativeQuery = true)
    void deleteByEmail(String email);

    // Heredado de JpaRepository:
    // save(tfgentity entity)        → INSERT / UPDATE
    // deleteById(Long id)           → DELETE WHERE id = ?
    // delete(tfgentity entity)      → DELETE por entidad
    // deleteAll()                   → DELETE FROM DatosJugador
}