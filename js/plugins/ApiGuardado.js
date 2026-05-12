//=============================================================================
// ApiGuardado.js
// Sincroniza la partida con el servidor.
// - Bloquea el guardado del menú y muestra aviso de punto de control.
// - Al cargar, detecta si el jugador es nuevo y no interfiere.
//=============================================================================

const API_BASE = "https://marcovarasperez.duckdns.org/api/jugadores";

// ─────────────────────────────────────────────────────────────────────────────
// AVISO FLOTANTE en pantalla (sin librerías externas)
// ─────────────────────────────────────────────────────────────────────────────
function rpg_mostrarAviso(mensaje, tipo = "info") {
    // Eliminar aviso anterior si existe
    const anterior = document.getElementById("rpg-aviso");
    if (anterior) anterior.remove();

    const colores = {
        info:    { bg: "rgba(10,14,28,0.93)", border: "#c9a84c", text: "#f0d080" },
        ok:      { bg: "rgba(10,22,14,0.93)", border: "#4a9",    text: "#8de8b0" },
        error:   { bg: "rgba(28,10,10,0.93)", border: "#c44",    text: "#f4a4a4" }
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

    // Fade in
    requestAnimationFrame(() => { div.style.opacity = "1"; });

    // Fade out y eliminar
    setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 350);
    }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOQUEAR el guardado del menú y mostrar aviso
// ─────────────────────────────────────────────────────────────────────────────
const _Scene_Menu_commandSave = Scene_Menu.prototype.commandSave;
Scene_Menu.prototype.commandSave = function() {
    // Cerrar el menú y mostrar el aviso en lugar de abrir la pantalla de guardado
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
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
        console.error("[ApiGuardado] Sin conexión:", e.message);
        rpg_mostrarAviso("Sin conexión con el servidor", "error");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECTAR si el jugador es nuevo (datos por defecto del backend)
// ─────────────────────────────────────────────────────────────────────────────
function rpg_esJugadorNuevo(datos) {
    if (!datos) return true;

    const sinProgreso =
        datos.tiempoJuego === 0 &&
        datos.bit         === 0 &&
        Object.keys(datos.interruptores    || {}).length === 0 &&
        Object.keys(datos.variables        || {}).length === 0 &&
        Object.keys(datos.inventarioObjetos|| {}).length === 0 &&
        Object.keys(datos.inventarioArmas  || {}).length === 0 &&
        (datos.personajesId || []).length === 0;

    return sinProgreso;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARGAR desde el servidor y aplicar al juego
// ─────────────────────────────────────────────────────────────────────────────
async function rpg_cargarDesdeServidor() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) return;

    try {
        const res = await fetch(`${API_BASE}/usuario/${encodeURIComponent(usuario)}`, {
            headers: { "Accept": "application/json" }
        });
        if (!res.ok) return;

        const d = await res.json();

        // ── Jugador nuevo: no hay datos que cargar, el juego arranca normal ──
        if (rpg_esJugadorNuevo(d)) {
            console.log("[ApiGuardado] Jugador nuevo, inicio desde el principio.");
            return;
        }

        // ── Jugador con partida guardada: restaurar estado ────────────────────
        console.log("[ApiGuardado] Cargando partida de:", usuario);

        // Oro
        const diferencia = d.bit - $gameParty.gold();
        if (diferencia !== 0) $gameParty.gainGold(diferencia);

        // Interruptores (primero los ponemos todos a false, luego los del guardado)
        for (let i = 1; i < $dataSystem.switches.length; i++) {
            $gameSwitches.setValue(i, false);
        }
        Object.entries(d.interruptores || {}).forEach(([id, val]) => {
            $gameSwitches.setValue(Number(id), val === 1);
        });

        // Variables
        Object.entries(d.variables || {}).forEach(([id, val]) => {
            $gameVariables.setValue(Number(id), val);
        });

        // Inventario — limpiar y reponer
        $gameParty.items().forEach(item   => $gameParty.loseItem(item, 99));
        $gameParty.weapons().forEach(item => $gameParty.loseItem(item, 99));
        $gameParty.armors().forEach(item  => $gameParty.loseItem(item, 99));

        Object.entries(d.inventarioObjetos || {}).forEach(([id, cant]) => {
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
        Object.entries(d.objetosClave || {}).forEach(([id, cant]) => {
            const item = $dataItems[Number(id)];
            if (item) $gameParty.gainItem(item, cant);
        });

        // Teleportar al jugador a donde guardó
        $gamePlayer.reserveTransfer(d.idMapa, d.x, d.y, 2, 0);

        console.log("[ApiGuardado] Partida restaurada correctamente.");

    } catch (e) {
        console.error("[ApiGuardado] Sin conexión al cargar:", e.message);
    }
}