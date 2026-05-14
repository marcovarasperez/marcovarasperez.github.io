//=============================================================================
// ApiGuardado.js — Slots de guardado en el servidor
//=============================================================================

const API_BASE = "https://marcovarasperez.duckdns.org/api/jugadores";

// ─── Guardar slot en el servidor ─────────────────────────────────────────────
// Reemplazamos saveGame para mandar los datos a la API además de guardar local.
// IMPORTANTE: mantenemos la llamada síncrona original para no romper RPG Maker.

const _DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function(savefileId) {
    const resultado = _DataManager_saveGame.call(this, savefileId);

    const usuario = localStorage.getItem("rpg_usuario");
    if (usuario) {
        const contenido = this.makeSaveContents();
        const datosSlot = JSON.stringify({
            contenido:  LZString.compressToBase64(JsonEx.stringify(contenido)),
            timestamp:  Date.now(),
            titulo:     ($gameMap && $gameMap.displayName()) ? $gameMap.displayName() : "",
            nivel:      ($gameParty && $gameParty.leader()) ? $gameParty.leader().level : 1,
            tiempo:     Graphics.frameCount
        });

        fetch(`${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${savefileId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(datosSlot)
        }).then(function() {
            console.log("[ApiGuardado] Slot " + savefileId + " guardado en servidor");
        }).catch(function(e) {
            console.error("[ApiGuardado] Error al guardar slot:", e.message);
        });
    }

    return resultado;
};

// ─── Cargar slot desde el servidor ───────────────────────────────────────────
// Carga desde el servidor si está disponible, si no usa localStorage.
// IMPORTANTE: la carga es asíncrona, usamos rpg_cargarSlot() desde eventos.

const _DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = function(savefileId) {
    return _DataManager_loadGame.call(this, savefileId);
};

// ─── Cargar slot desde evento (asíncrono) ────────────────────────────────────
// Usa este método desde un evento Script para cargar desde el servidor.
// Ejemplo: rpg_cargarSlot(1);

async function rpg_cargarSlot(slotId) {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) {
        rpg_mostrarAviso("No hay sesión iniciada", "error");
        return;
    }

    try {
        const res = await fetch(
            `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${slotId}`,
            { headers: { "Accept": "application/json" } }
        );

        if (res.ok) {
            const datosSlotStr = await res.json();
            const datosSlot    = JSON.parse(datosSlotStr);
            const contenido    = JsonEx.parse(
                LZString.decompressFromBase64(datosSlot.contenido)
            );
            DataManager.createGameObjects();
            DataManager.extractSaveContents(contenido);
            DataManager._lastAccessedId = slotId;
            rpg_mostrarAviso("Partida cargada correctamente", "ok");
            console.log("[ApiGuardado] Slot " + slotId + " cargado desde servidor");
        } else {
            rpg_mostrarAviso("No se encontró la partida en el servidor", "error");
        }
    } catch (e) {
        console.error("[ApiGuardado] Error al cargar slot:", e.message);
        rpg_mostrarAviso("Error al cargar — usando guardado local", "error");
        DataManager.loadGame(slotId);
    }
}

// ─── Guardar desde un evento de punto de control ─────────────────────────────
// En los eventos del mapa usa el comando Script con: rpg_guardarSlot(1)
// donde el número es el slot que quieres usar (1-20)

async function rpg_guardarSlot(slotId) {
    slotId = slotId || 1;
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) {
        rpg_mostrarAviso("No hay sesión iniciada", "error");
        return;
    }

    const contenido = DataManager.makeSaveContents();
    const datosSlot = JSON.stringify({
        contenido:  LZString.compressToBase64(JsonEx.stringify(contenido)),
        timestamp:  Date.now(),
        titulo:     ($gameMap && $gameMap.displayName()) ? $gameMap.displayName() : "",
        nivel:      ($gameParty && $gameParty.leader()) ? $gameParty.leader().level : 1,
        tiempo:     Graphics.frameCount
    });

    try {
        const res = await fetch(
            `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${slotId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(datosSlot)
            }
        );
        if (res.ok) {
            rpg_mostrarAviso("Partida guardada correctamente", "ok");
            _DataManager_saveGame.call(DataManager, slotId); // respaldo local
        } else {
            rpg_mostrarAviso("Error al guardar la partida", "error");
        }
    } catch (e) {
        console.error("[ApiGuardado] Sin conexión:", e.message);
        rpg_mostrarAviso("Sin conexión — guardado solo local", "error");
        _DataManager_saveGame.call(DataManager, slotId); // respaldo local
    }
}

// ─── Bloquear guardado del menú ───────────────────────────────────────────────
// Impide guardar desde el menú, solo se puede desde puntos de control.
const _Scene_Menu_commandSave = Scene_Menu.prototype.commandSave;
Scene_Menu.prototype.commandSave = function() {
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
};

// ─── Aviso flotante ───────────────────────────────────────────────────────────
function rpg_mostrarAviso(mensaje, tipo) {
    tipo = tipo || "info";
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
    div.style.cssText = [
        "position:fixed", "bottom:60px", "left:50%", "transform:translateX(-50%)",
        "background:" + c.bg, "border:1px solid " + c.border, "color:" + c.text,
        "font-family:'Cinzel',serif", "font-size:14px", "letter-spacing:0.08em",
        "padding:12px 28px", "border-radius:3px", "z-index:9999",
        "pointer-events:none", "opacity:0", "transition:opacity 0.3s", "white-space:nowrap",
        "box-shadow:0 4px 20px rgba(0,0,0,0.6)"
    ].join(";");
    div.textContent = mensaje;
    document.body.appendChild(div);
    requestAnimationFrame(function() { div.style.opacity = "1"; });
    setTimeout(function() {
        div.style.opacity = "0";
        setTimeout(function() { div.remove(); }, 350);
    }, 3000);
}