package com.trinitarias.resqbot_api_cliente.service;

import com.trinitarias.resqbot_api_cliente.dto.UsuarioDto;
import com.trinitarias.resqbot_api_cliente.entity.UsuarioEntity;
import com.trinitarias.resqbot_api_cliente.repository.UsuarioRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    // ── Registro ──────────────────────────────────────────────────────────────
    public UsuarioDto register(UsuarioDto dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso");
        }

        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuarioRepository.save(usuario);

        String token = generarToken(usuario.getUsername());
        return new UsuarioDto(usuario.getUsername(), token, null);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public UsuarioDto login(UsuarioDto dto) {
        UsuarioEntity usuario = usuarioRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(dto.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos");
        }

        String token = generarToken(usuario.getUsername());
        // Devolvemos también el saveData para que el juego lo cargue al entrar
        return new UsuarioDto(usuario.getUsername(), token, usuario.getSaveData());
    }

    // ── Guardar partida ───────────────────────────────────────────────────────
    public void guardarPartida(String token, String saveData) {
        String username = validarTokenYObtenerUsername(token);
        UsuarioEntity usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new SecurityException("Usuario no encontrado"));
        usuario.setSaveData(saveData);
        usuarioRepository.save(usuario);
    }

    // ── Cargar partida ────────────────────────────────────────────────────────
    public UsuarioDto cargarPartida(String token) {
        String username = validarTokenYObtenerUsername(token);
        UsuarioEntity usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new SecurityException("Usuario no encontrado"));
        return new UsuarioDto(usuario.getUsername(), token, usuario.getSaveData());
    }

    // ── Helpers JWT ───────────────────────────────────────────────────────────
    private Key getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    private String generarToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String validarTokenYObtenerUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            throw new SecurityException("Token inválido o expirado");
        }
    }
}
