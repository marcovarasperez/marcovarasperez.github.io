package com.trinitarias.tfg.dto;

public class tfgdto {

    private String usuario;
    private String password;
    private String email;

    public tfgdto() {
        super();
    }

    public tfgdto(String usuario, String password, String email) {
        this.usuario = usuario;
        this.password = password;
        this.email = email;
    }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}