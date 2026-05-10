package com.trinitarias.tfg.dto;

import java.util.ArrayList;
import java.util.HashMap;
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

    // Interruptores y Variables - CORREGIDO A INTEGER
    private Map<Integer, Integer> interruptores = new HashMap<>();
    private Map<Integer, Integer> variables = new HashMap<>();

    // Estado del Grupo
    private List<Integer> personajesId = new ArrayList<>();
    private Map<Integer, Integer> nivelPersonaje = new HashMap<>();

    // Inventario
    private Map<Integer, Integer> inventarioObjetos = new HashMap<>();
    private Map<Integer, Integer> inventarioArmas = new HashMap<>();
    private Map<Integer, Integer> inventarioArmaduras = new HashMap<>();
    private Map<Integer, Integer> objetosClave = new HashMap<>();

    // Equipo y Habilidades
    private Map<Integer, List<Integer>> equipoPersonaje = new HashMap<>();
    private Map<Integer, List<Integer>> habilidadesPersonaje = new HashMap<>();

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
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public int getIdMapa() { return idMapa; }
    public void setIdMapa(int idMapa) { this.idMapa = idMapa; }

    public int getX() { return x; }
    public void setX(int x) { this.x = x; }

    public int getY() { return y; }
    public void setY(int y) { this.y = y; }

    public long getBit() { return bit; }
    public void setBit(long bit) { this.bit = bit; }

    public double getTiempoJuego() { return tiempoJuego; }
    public void setTiempoJuego(double tiempoJuego) { this.tiempoJuego = tiempoJuego; }

    public Map<Integer, Integer> getInterruptores() { return interruptores; }
    public void setInterruptores(Map<Integer, Integer> interruptores) { this.interruptores = interruptores; }

    public Map<Integer, Integer> getVariables() { return variables; }
    public void setVariables(Map<Integer, Integer> variables) { this.variables = variables; }

    public List<Integer> getPersonajesId() { return personajesId; }
    public void setPersonajesId(List<Integer> personajesId) { this.personajesId = personajesId; }

    public Map<Integer, Integer> getNivelPersonaje() { return nivelPersonaje; }
    public void setNivelPersonaje(Map<Integer, Integer> nivelPersonaje) { this.nivelPersonaje = nivelPersonaje; }

    public Map<Integer, Integer> getInventarioObjetos() { return inventarioObjetos; }
    public void setInventarioObjetos(Map<Integer, Integer> inventarioObjetos) { this.inventarioObjetos = inventarioObjetos; }

    public Map<Integer, Integer> getInventarioArmas() { return inventarioArmas; }
    public void setInventarioArmas(Map<Integer, Integer> inventarioArmas) { this.inventarioArmas = inventarioArmas; }

    public Map<Integer, Integer> getInventarioArmaduras() { return inventarioArmaduras; }
    public void setInventarioArmaduras(Map<Integer, Integer> inventarioArmaduras) { this.inventarioArmaduras = inventarioArmaduras; }

    public Map<Integer, Integer> getObjetosClave() { return objetosClave; }
    public void setObjetosClave(Map<Integer, Integer> objetosClave) { this.objetosClave = objetosClave; }

    public Map<Integer, List<Integer>> getEquipoPersonaje() { return equipoPersonaje; }
    public void setEquipoPersonaje(Map<Integer, List<Integer>> equipoPersonaje) { this.equipoPersonaje = equipoPersonaje; }

    public Map<Integer, List<Integer>> getHabilidadesPersonaje() { return habilidadesPersonaje; }
    public void setHabilidadesPersonaje(Map<Integer, List<Integer>> habilidadesPersonaje) { this.habilidadesPersonaje = habilidadesPersonaje; }
}