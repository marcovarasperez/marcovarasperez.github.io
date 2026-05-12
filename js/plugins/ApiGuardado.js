//=============================================================================
// ApiGuardado.js — Slots de guardado en el servidor
//=============================================================================

const API_BASE = "https://marcovarasperez.duckdns.org/api/jugadores";

// ─── Guardar slot en el servidor ─────────────────────────────────────────────
// RPG Maker llama a DataManager.saveGame(savefileId) cuando el jugador guarda.
// Reemplazamos ese método para mandar los datos a la API en lugar del navegador.

const _DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = async function(savefileId) {
    const usuario = localStorage.getItem("rpg_usuario");

    // Construir los datos de guardado exactamente igual que hace RPG Maker
    const contenido   = this.makeSaveContents();
    const infoGuardar = { globalInfo: this.loadGlobalInfo(), savefileId };
    const datosSlot   = JSON.stringify({
        contenido:   LZString.compressToBase64(JsonEx.stringify(contenido)),
        timestamp:   Date.now(),
        titulo:      $gameMap.displayName(),
        nivel:       $gameParty.leader() ? $gameParty.leader().level : 1,
        tiempo:      Graphics.frameCount
    });

    // Guardar en el servidor
    if (usuario) {
        try {
            await fetch(`${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${savefileId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(datosSlot)
            });
            console.log(`[ApiGuardado] Slot ${savefileId} guardado en servidor`);
        } catch (e) {
            console.error("[ApiGuardado] Error al guardar slot:", e.message);
        }
    }

    // Guardar también en localStorage como respaldo
    return _DataManager_saveGame.call(this, savefileId);
};

// ─── Cargar slot desde el servidor ───────────────────────────────────────────
// RPG Maker llama a DataManager.loadGame(savefileId) cuando el jugador carga.

const _DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = async function(savefileId) {
    const usuario = localStorage.getItem("rpg_usuario");

    if (usuario) {
        try {
            const res = await fetch(
                `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${savefileId}`,
                { headers: { "Accept": "application/json" } }
            );

            if (res.ok) {
                const datosSlotStr = await res.json();
                const datosSlot    = JSON.parse(datosSlotStr);

                // Descomprimir y aplicar exactamente como hace RPG Maker
                const contenido = JsonEx.parse(
                    LZString.decompressFromBase64(datosSlot.contenido)
                );
                this.createGameObjects();
                this.extractSaveContents(contenido);
                this._lastAccessedId = savefileId;
                console.log(`[ApiGuardado] Slot ${savefileId} cargado desde servidor`);
                return true;
            }
        } catch (e) {
            console.error("[ApiGuardado] Error al cargar slot, usando localStorage:", e.message);
        }
    }

    // Si falla el servidor, intenta desde localStorage
    return _DataManager_loadGame.call(this, savefileId);
};

// ─── Pantalla de carga: saber qué slots existen ───────────────────────────────
// RPG Maker usa DataManager.loadSavefileInfo(savefileId) para mostrar
// la información de cada slot en la pantalla de carga.

const _DataManager_loadSavefileInfo = DataManager.loadSavefileInfo;
DataManager.loadSavefileInfo = function(savefileId) {
    // Primero devuelve lo que hay en localStorage para que la pantalla cargue rápido
    // (la sincronización con el servidor se hace en segundo plano)
    return _DataManager_loadSavefileInfo.call(this, savefileId);
};

// ─── Bloquear guardado del menú ───────────────────────────────────────────────
const _Scene_Menu_commandSave = Scene_Menu.prototype.commandSave;
Scene_Menu.prototype.commandSave = function() {
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
};

// ─── Aviso flotante ───────────────────────────────────────────────────────────
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
        position:fixed; bottom:60px; left:50%; transform:translateX(-50%);
        background:${c.bg}; border:1px solid ${c.border}; color:${c.text};
        font-family:'Cinzel',serif; font-size:14px; letter-spacing:0.08em;
        padding:12px 28px; border-radius:3px; z-index:9999;
        pointer-events:none; opacity:0; transition:opacity 0.3s; white-space:nowrap;
        box-shadow:0 4px 20px rgba(0,0,0,0.6);
    `;
    div.textContent = mensaje;
    document.body.appendChild(div);
    requestAnimationFrame(() => { div.style.opacity = "1"; });
    setTimeout(() => { div.style.opacity = "0"; setTimeout(() => div.remove(), 350); }, 3000);
}

// ─── Guardar desde un evento de punto de control ──────────────────────────────
// En los eventos del mapa usa el comando Script con: rpg_guardarSlot(1)
// donde el número es el slot que quieres usar (1-20)

async function rpg_guardarSlot(slotId = 1) {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) return;

    const contenido = DataManager.makeSaveContents();
    const datosSlot = JSON.stringify({
        contenido:  LZString.compressToBase64(JsonEx.stringify(contenido)),
        timestamp:  Date.now(),
        titulo:     $gameMap.displayName(),
        nivel:      $gameParty.leader() ? $gameParty.leader().level : 1,
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
            // Guardar también en localStorage como respaldo
            DataManager.saveGame(slotId);
        } else {
            rpg_mostrarAviso("Error al guardar la partida", "error");
        }
    } catch (e) {
        console.error("[ApiGuardado] Sin conexión:", e.message);
        rpg_mostrarAviso("Sin conexión — guardado solo local", "error");
        DataManager.saveGame(slotId); // respaldo local
    }
}