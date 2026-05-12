package com.trinitarias.tfg.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

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

    private int idMapa = 1;
    private int x = 10;
    private int y = 10;
    private long bit = 0;
    private double tiempoJuego = 0.0;

    @ElementCollection
    @CollectionTable(name = "slots_guardado", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "slot_id")
    @Column(name = "datos", columnDefinition = "TEXT")
    private Map<Integer, String> slotsGuardado = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_interruptores", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "id_interruptor")
    @Column(name = "valor")
    private Map<Integer, Integer> interruptores = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_variables", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "id_variable")
    @Column(name = "valor")
    private Map<Integer, Integer> variables = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_personajes", joinColumns = @JoinColumn(name = "jugador_id"))
    @Column(name = "personaje_id")
    private List<Integer> personajesId = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_nivel_personaje", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "personaje_id")
    @Column(name = "nivel")
    private Map<Integer, Integer> nivelPersonaje = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_inventario_objetos", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "objeto_id")
    @Column(name = "cantidad")
    private Map<Integer, Integer> inventarioObjetos = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_inventario_armas", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "arma_id")
    @Column(name = "cantidad")
    private Map<Integer, Integer> inventarioArmas = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_inventario_armaduras", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "armadura_id")
    @Column(name = "cantidad")
    private Map<Integer, Integer> inventarioArmaduras = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "datos_jugador_objetos_clave", joinColumns = @JoinColumn(name = "jugador_id"))
    @MapKeyColumn(name = "objeto_id")
    @Column(name = "cantidad")
    private Map<Integer, Integer> objetosClave = new HashMap<>();

    @Convert(converter = tfgentity.MapListConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<Integer, List<Integer>> equipoPersonaje = new HashMap<>();

    @Convert(converter = tfgentity.MapListConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<Integer, List<Integer>> habilidadesPersonaje = new HashMap<>();

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

    @Converter
    public static class MapListConverter implements AttributeConverter<Map<Integer, List<Integer>>, String> {
        private static final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(Map<Integer, List<Integer>> attribute) {
            if (attribute == null) return "{}";
            try {
                return objectMapper.writeValueAsString(attribute);
            } catch (Exception e) {
                throw new RuntimeException("Error al convertir Map a JSON", e);
            }
        }

        @Override
        public Map<Integer, List<Integer>> convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.isEmpty()) return new HashMap<>();
            try {
                return objectMapper.readValue(dbData, new TypeReference<Map<Integer, List<Integer>>>() {});
            } catch (Exception e) {
                throw new RuntimeException("Error al convertir JSON a Map", e);
            }
        }
    }
}