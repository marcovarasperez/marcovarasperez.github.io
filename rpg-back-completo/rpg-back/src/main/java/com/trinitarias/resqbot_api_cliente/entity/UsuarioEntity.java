package com.trinitarias.resqbot_api_cliente.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class UsuarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    // Datos de la partida guardada (JSON comprimido de RPG Maker MV)
    // Es null si el jugador todavia no ha guardado
    @Column(name = "save_data", columnDefinition = "TEXT")
    private String saveData;

    public UsuarioEntity() {}

    public UsuarioEntity(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSaveData() { return saveData; }
    public void setSaveData(String saveData) { this.saveData = saveData; }
}
