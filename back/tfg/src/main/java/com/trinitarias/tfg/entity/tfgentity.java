package com.trinitarias.tfg.entity;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "datos_jugador")
public class tfgentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String usuario;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @ElementCollection
    @CollectionTable(name = "slots_guardado", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "slot_id")
    @Column(name = "datos", columnDefinition = "TEXT")
    private Map<Integer, String> slotsGuardado = new HashMap<>();

    public tfgentity() { }

    public tfgentity(String usuario, String password, String email) {
        this.usuario = usuario;
        this.password = password;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Map<Integer, String> getSlotsGuardado() { return slotsGuardado; }
    public void setSlotsGuardado(Map<Integer, String> slotsGuardado) { this.slotsGuardado = slotsGuardado; }
}