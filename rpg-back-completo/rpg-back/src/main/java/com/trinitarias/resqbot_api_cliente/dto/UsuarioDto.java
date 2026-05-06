package com.trinitarias.resqbot_api_cliente.dto;

public class UsuarioDto {

    private String username;
    private String password;
    private String saveData;

    // Token JWT que se devuelve al cliente tras login/register
    private String token;

    public UsuarioDto() {}

    // Constructor para login/register (sin saveData)
    public UsuarioDto(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Constructor para respuesta con token
    public UsuarioDto(String username, String token, String saveData) {
        this.username = username;
        this.token = token;
        this.saveData = saveData;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSaveData() { return saveData; }
    public void setSaveData(String saveData) { this.saveData = saveData; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
