//=============================================================================
// ApiGuardado.js
// Sincroniza la partida con el servidor.
//
// FLUJO COMPLETO:
// 1. Jugador pulsa "Nueva Partida" en el título
// 2. Se inicializan los objetos del juego (setupNewGame)
// 3. Se llama a la API y se espera la respuesta
// 4. Si hay partida guardada → se aplican los datos al juego
// 5. Si es jugador nuevo → el juego arranca desde el Intro (mapa 11)
// 6. La escena transiciona al mapa con el jugador ya en su posición
//
// GUARDADO:
// - El menú de guardado muestra un aviso: "Guarda en un punto de control"
// - En los eventos de punto de control: rpg_guardarEnServidor()
//=============================================================================

const API_BASE = "https://marcovarasperez.duckdns.org/api/jugadores";

// ─────────────────────────────────────────────────────────────────────────────
// AVISO FLOTANTE en pantalla
// ─────────────────────────────────────────────────────────────────────────────
function rpg_mostrarAviso(mensaje, tipo = "info") {
    const anterior = document.getElementById("rpg-aviso");
    if (anterior) anterior.remove();

    const colores = {
        info:  { bg: "rgba(10,14,28,0.93)", border: "#c9a84c", text: "#f0d080" },
        ok:    { bg: "rgba(10,22,14,0.93)", border: "#4a9",    text: "#8de8b0" },
        error: { bg: "rgba(28,10,10,0.93)", border: "#c44",    text: "#f4a4a4" }
    };
    const c = colores[tipo] || colores.info;

    const div = document.createElement("div");
    div.id = "rpg-aviso";
    div.style.cssText = `
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: ${c.bg};
        border: 1px solid ${c.border};
        color: ${c.text};
        font-family: 'Cinzel', serif;
        font-size: 14px;
        letter-spacing: 0.08em;
        padding: 12px 28px;
        border-radius: 3px;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        opacity: 0;
        transition: opacity 0.3s;
        white-space: nowrap;
    `;
    div.textContent = mensaje;
    document.body.appendChild(div);
    requestAnimationFrame(() => { div.style.opacity = "1"; });
    setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 350);
    }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOQUEAR el guardado del menú
// ─────────────────────────────────────────────────────────────────────────────
const _Scene_Menu_commandSave = Scene_Menu.prototype.commandSave;
Scene_Menu.prototype.commandSave = function() {
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECTAR si el jugador es nuevo (nunca ha guardado)
// ─────────────────────────────────────────────────────────────────────────────
function rpg_esJugadorNuevo(datos) {
    if (!datos) return true;
    // Si tiempoJuego es 0 nunca ha guardado → jugador nuevo
    return datos.tiempoJuego === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// APLICAR datos del servidor al estado actual del juego
// (los objetos del juego ya deben estar inicializados con setupNewGame)
// ─────────────────────────────────────────────────────────────────────────────
function rpg_aplicarDatos(d) {
    // ── Oro ──────────────────────────────────────────────────────────────────
    const diferencia = (d.bit || 0) - $gameParty.gold();
    if (diferencia !== 0) $gameParty.gainGold(diferencia);

    // ── Interruptores ────────────────────────────────────────────────────────
    // Primero resetear todos a false, luego aplicar los guardados
    for (let i = 1; i < $dataSystem.switches.length; i++) {
        $gameSwitches.setValue(i, false);
    }
    Object.entries(d.interruptores || {}).forEach(([id, val]) => {
        $gameSwitches.setValue(Number(id), val === 1);
    });

    // ── Variables ────────────────────────────────────────────────────────────
    Object.entries(d.variables || {}).forEach(([id, val]) => {
        $gameVariables.setValue(Number(id), val);
    });

    // ── Inventario: limpiar y reponer ────────────────────────────────────────
    $gameParty.items().forEach(item   => $gameParty.gainItem(item, -$gameParty.numItems(item)));
    $gameParty.weapons().forEach(item => $gameParty.gainItem(item, -$gameParty.numItems(item)));
    $gameParty.armors().forEach(item  => $gameParty.gainItem(item, -$gameParty.numItems(item)));

    Object.entries(d.inventarioObjetos || {}).forEach(([id, cant]) => {
        const item = $dataItems[Number(id)];
        if (item) $gameParty.gainItem(item, cant);
    });
    Object.entries(d.objetosClave || {}).forEach(([id, cant]) => {
        const item = $dataItems[Number(id)];
        if (item) $gameParty.gainItem(item, cant);
    });
    Object.entries(d.inventarioArmas || {}).forEach(([id, cant]) => {
        const item = $dataWeapons[Number(id)];
        if (item) $gameParty.gainItem(item, cant);
    });
    Object.entries(d.inventarioArmaduras || {}).forEach(([id, cant]) => {
        const item = $dataArmors[Number(id)];
        if (item) $gameParty.gainItem(item, cant);
    });

    // ── Personajes en el grupo ───────────────────────────────────────────────
    if (d.personajesId && d.personajesId.length > 0) {
        // Quitar todos los actuales
        $gameParty.members().forEach(a => $gameParty.removeActor(a.actorId()));
        // Añadir los guardados
        d.personajesId.forEach(id => {
            if ($dataActors[id]) $gameParty.addActor(id);
        });
    }

    // ── Niveles de cada personaje ────────────────────────────────────────────
    Object.entries(d.nivelPersonaje || {}).forEach(([id, nivel]) => {
        const actor = $gameActors.actor(Number(id));
        if (actor) actor.changeLevel(nivel, false);
    });

    // ── Equipo de cada personaje ─────────────────────────────────────────────
    Object.entries(d.equipoPersonaje || {}).forEach(([id, equips]) => {
        const actor = $gameActors.actor(Number(id));
        if (!actor) return;
        equips.forEach((itemId, slot) => {
            if (itemId === 0) {
                actor.changeEquipById(slot, 0);
            } else {
                actor.changeEquipById(slot, itemId);
            }
        });
    });

    // ── Teleportar al jugador a donde guardó ─────────────────────────────────
    // reserveTransfer hace la transferencia cuando el mapa esté listo
    $gamePlayer.reserveTransfer(d.idMapa, d.x, d.y, 2, 0);

    console.log("[ApiGuardado] Datos aplicados → mapa", d.idMapa, "pos", d.x, d.y);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARGAR partida desde el servidor
// Devuelve los datos o null si hay error / jugador nuevo
// ─────────────────────────────────────────────────────────────────────────────
async function rpg_cargarPartida() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) {
        console.log("[ApiGuardado] No hay usuario en localStorage");
        return null;
    }

    try {
        const res = await fetch(`${API_BASE}/usuario/${encodeURIComponent(usuario)}`, {
            headers: { "Accept": "application/json" }
        });
        if (!res.ok) {
            console.error("[ApiGuardado] Error al obtener datos:", res.status);
            return null;
        }
        const datos = await res.json();
        return datos;
    } catch (e) {
        console.error("[ApiGuardado] Sin conexión al cargar:", e.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERCEPTAR "Nueva Partida" en la pantalla de título
//
// Orden de ejecución:
// 1. setupNewGame()      → inicializa todos los objetos del juego
// 2. rpg_cargarPartida() → llama a la API y espera la respuesta
// 3. Si hay datos        → rpg_aplicarDatos() aplica todo al juego
// 4. fadeOutAll()        → transición de pantalla
// 5. SceneManager.goto() → va al mapa (ya con la posición correcta)
// ─────────────────────────────────────────────────────────────────────────────
Scene_Title.prototype.commandNewGame = async function() {
    // 1. Inicializar juego con valores por defecto
    DataManager.setupNewGame();
    this._commandWindow.close();

    // 2. Cargar datos del servidor
    console.log("[ApiGuardado] Cargando partida del servidor...");
    const datos = await rpg_cargarPartida();

    if (datos && !rpg_esJugadorNuevo(datos)) {
        // 3. Jugador con partida guardada → aplicar datos
        console.log("[ApiGuardado] Partida encontrada, restaurando...");
        rpg_aplicarDatos(datos);
    } else {
        // Jugador nuevo → arranca desde el mapa Intro (valores por defecto)
        console.log("[ApiGuardado] Jugador nuevo, inicio desde el principio.");
    }

    // 4 y 5. Transición al mapa
    this.fadeOutAll();
    SceneManager.goto(Scene_Map);
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUIR los datos de guardado desde el estado actual del juego
// ─────────────────────────────────────────────────────────────────────────────
function rpg_construirDatosGuardado() {
    const interruptores = {};
    for (let i = 1; i < $dataSystem.switches.length; i++) {
        if ($gameSwitches.value(i)) interruptores[i] = 1;
    }

    const variables = {};
    for (let i = 1; i < $dataSystem.variables.length; i++) {
        const v = $gameVariables.value(i);
        if (v !== 0) variables[i] = v;
    }

    const personajesId = $gameParty.members().map(a => a.actorId());

    const nivelPersonaje = {};
    personajesId.forEach(id => {
        nivelPersonaje[id] = $gameActors.actor(id).level;
    });

    const inventarioObjetos   = {};
    const inventarioArmas     = {};
    const inventarioArmaduras = {};
    const objetosClave        = {};

    $gameParty.items().forEach(item => {
        if (item.itypeId === 2) {
            objetosClave[item.id]      = $gameParty.numItems(item);
        } else {
            inventarioObjetos[item.id] = $gameParty.numItems(item);
        }
    });
    $gameParty.weapons().forEach(item => {
        inventarioArmas[item.id] = $gameParty.numItems(item);
    });
    $gameParty.armors().forEach(item => {
        inventarioArmaduras[item.id] = $gameParty.numItems(item);
    });

    const equipoPersonaje      = {};
    const habilidadesPersonaje = {};
    personajesId.forEach(id => {
        const a = $gameActors.actor(id);
        equipoPersonaje[id]      = a.equips().map(e => e ? e.id : 0);
        habilidadesPersonaje[id] = a.skills().map(s => s.id);
    });

    return {
        idMapa:      $gameMap.mapId(),
        x:           $gamePlayer.x,
        y:           $gamePlayer.y,
        bit:         $gameParty.gold(),
        tiempoJuego: Graphics.frameCount / 60,
        interruptores,
        variables,
        personajesId,
        nivelPersonaje,
        inventarioObjetos,
        inventarioArmas,
        inventarioArmaduras,
        objetosClave,
        equipoPersonaje,
        habilidadesPersonaje
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// GUARDAR en el servidor (llamar desde eventos de punto de control)
// ─────────────────────────────────────────────────────────────────────────────
async function rpg_guardarEnServidor() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) return;

    const datos = rpg_construirDatosGuardado();

    try {
        const res = await fetch(`${API_BASE}/actualizar/${encodeURIComponent(usuario)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            rpg_mostrarAviso("Partida guardada correctamente", "ok");
        } else {
            const err = await res.text();
            console.error("[ApiGuardado] Error al guardar:", err);
            rpg_mostrarAviso("Error al guardar la partida", "error");
        }
    } catch (e) {
        console.error("[ApiGuardado] Sin conexión al guardar:", e.message);
        rpg_mostrarAviso("Sin conexión con el servidor", "error");
    }
}