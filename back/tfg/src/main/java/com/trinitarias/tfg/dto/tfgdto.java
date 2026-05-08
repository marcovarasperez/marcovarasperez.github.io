package com.trinitarias.tfg.dto;

import java.util.List;
import java.util.Map;

public class tfgdto {
    // Datos del Usuario
    private String usuario;
    private String password;
    private String email;

    // Datos del Juego
    private int idMapa;
    private int x;
    private int y;
    private long bit;
    private double tiempoJuego;

    // Interruptores y Variables
    private Map<Integer, Boolean> interruptores;
    private Map<Integer, Integer> variables;

    // Estado del Grupo
    private List<Integer> personajesId;
    private Map<Integer, Integer> nivelPersonaje;

    // Inventario
    private Map<Integer, Integer> inventarioObjetos;
    private Map<Integer, Integer> inventarioArmas;
    private Map<Integer, Integer> inventarioArmaduras;
    private Map<Integer, Integer> objetosClave;

    // Equipo y Habilidades
    private Map<Integer, List<Integer>> equipoPersonaje;
    private Map<Integer, List<Integer>> habilidadesPersonaje;

    // Constructores

    public tfgdto() {
        super();
    }

    public tfgdto(String usuario, String password, String email) {
        this.usuario = usuario;
        this.password = password;
        this.email = email;
    }

    // Getters y Setters

    public String getUsuario() {
        return usuario;
    }
    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public int getIdMapa() {
        return idMapa;
    }
    public void setIdMapa(int idMapa) {
        this.idMapa = idMapa;
    }

    public int getX() {
        return x;
    }
    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }
    public void setY(int y) {
        this.y = y;
    }

    public long getBit() {
        return bit;
    }
    public void setBit(long bit) {
        this.bit = bit;
    }

    public double getTiempoJuego() {
        return tiempoJuego;
    }
    public void setTiempoJuego(double tiempoJuego) {
        this.tiempoJuego = tiempoJuego;
    }

    public Map<Integer, Boolean> getInterruptores() {
        return interruptores;
    }
    public void setInterruptores(Map<Integer, Boolean> interruptores) {
        this.interruptores = interruptores;
    }

    public Map<Integer, Integer> getVariables() {
        return variables;
    }
    public void setVariables(Map<Integer, Integer> variables) {
        this.variables = variables;
    }

    public List<Integer> getPersonajesId() {
        return personajesId;
    }
    public void setPersonajesId(List<Integer> personajesId) {
        this.personajesId = personajesId;
    }

    public Map<Integer, Integer> getNivelPersonaje() {
        return nivelPersonaje;
    }
    public void setNivelPersonaje(Map<Integer, Integer> nivelPersonaje) {
        this.nivelPersonaje = nivelPersonaje;
    }

    public Map<Integer, Integer> getInventarioObjetos() {
        return inventarioObjetos;
    }
    public void setInventarioObjetos(Map<Integer, Integer> inventarioObjetos) {
        this.inventarioObjetos = inventarioObjetos;
    }

    public Map<Integer, Integer> getInventarioArmas() {
        return inventarioArmas;
    }
    public void setInventarioArmas(Map<Integer, Integer> inventarioArmas) {
        this.inventarioArmas = inventarioArmas;
    }

    public Map<Integer, Integer> getInventarioArmaduras() {
        return inventarioArmaduras;
    }
    public void setInventarioArmaduras(Map<Integer, Integer> inventarioArmaduras) {
        this.inventarioArmaduras = inventarioArmaduras;
    }

    public Map<Integer, Integer> getObjetosClave() {
        return objetosClave;
    }
    public void setObjetosClave(Map<Integer, Integer> objetosClave) {
        this.objetosClave = objetosClave;
    }

    public Map<Integer, List<Integer>> getEquipoPersonaje() {
        return equipoPersonaje;
    }
    public void setEquipoPersonaje(Map<Integer, List<Integer>> equipoPersonaje) {
        this.equipoPersonaje = equipoPersonaje;
    }

    public Map<Integer, List<Integer>> getHabilidadesPersonaje() {
        return habilidadesPersonaje;
    }
    public void setHabilidadesPersonaje(Map<Integer, List<Integer>> habilidadesPersonaje) {
        this.habilidadesPersonaje = habilidadesPersonaje;
    }
}