//=============================================================================
// ApiGuardado.js — Slots de guardado en el servidor con UI de selección
//=============================================================================

const API_BASE  = "https://marcovarasperez.duckdns.org/api/jugadores";
const MAX_SLOTS = 5; // Número de slots disponibles (modifica si necesitas más)

//=============================================================================
// HELPERS
//=============================================================================

function _construirDatosSlot() {
    const contenido = DataManager.makeSaveContents();
    return {
        contenido: LZString.compressToBase64(JsonEx.stringify(contenido)),
        timestamp: Date.now(),
        titulo:    ($gameMap   && $gameMap.displayName()) ? $gameMap.displayName()   : "",
        nivel:     ($gameParty && $gameParty.leader())    ? $gameParty.leader().level : 1,
        tiempo:    Graphics.frameCount
    };
}

function _formatearTiempo(frames) {
    var seg = Math.floor((frames || 0) / 60);
    var h   = Math.floor(seg / 3600);
    var m   = Math.floor((seg % 3600) / 60);
    var s   = seg % 60;
    return h + "h " + String(m).padStart(2, "0") + "m " + String(s).padStart(2, "0") + "s";
}

function _formatearFecha(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
        + "  " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

//=============================================================================
// HOOK AUTOMÁTICO — DataManager.saveGame
// Manda al servidor cada vez que RPG Maker guarda (respaldo transparente).
//=============================================================================

const _DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function(savefileId) {
    const resultado = _DataManager_saveGame.call(this, savefileId);
    const usuario   = localStorage.getItem("rpg_usuario");
    if (usuario) {
        fetch(`${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${savefileId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body:    JSON.stringify(_construirDatosSlot())
        }).then(function() {
            console.log("[ApiGuardado] Slot " + savefileId + " guardado en servidor");
        }).catch(function(e) {
            console.error("[ApiGuardado] Error al guardar slot:", e.message);
        });
    }
    return resultado;
};

//=============================================================================
// rpg_guardarSlot(slotId)
// Guarda en el servidor + respaldo local. Llamar desde evento Script.
//=============================================================================

async function rpg_guardarSlot(slotId) {
    slotId = slotId || 1;
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesión iniciada", "error"); return false; }

    try {
        const res = await fetch(
            `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${slotId}`,
            {
                method:  "PUT",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body:    JSON.stringify(_construirDatosSlot())
            }
        );
        if (res.ok) {
            _DataManager_saveGame.call(DataManager, slotId); // respaldo local
            rpg_mostrarAviso("Partida guardada en el Slot " + slotId, "ok");
            return true;
        } else {
            rpg_mostrarAviso("Error al guardar la partida", "error");
            return false;
        }
    } catch (e) {
        console.error("[ApiGuardado] Sin conexión:", e.message);
        _DataManager_saveGame.call(DataManager, slotId); // respaldo local
        rpg_mostrarAviso("Sin conexión — guardado solo local", "error");
        return false;
    }
}

//=============================================================================
// rpg_cargarSlot(slotId)
// Carga desde el servidor. Devuelve true si tuvo éxito, false si no.
//=============================================================================

async function rpg_cargarSlot(slotId) {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesión iniciada", "error"); return false; }

    try {
        const res = await fetch(
            `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slot/${slotId}`,
            { headers: { "Accept": "application/json" } }
        );
        if (res.ok) {
            // El backend devuelve el objeto ya parseado (no un string con comillas extra)
            const datosSlot = await res.json();
            const contenido = JsonEx.parse(LZString.decompressFromBase64(datosSlot.contenido));
            DataManager.createGameObjects();
            DataManager.extractSaveContents(contenido);
            DataManager._lastAccessedId = slotId;
            console.log("[ApiGuardado] Slot " + slotId + " cargado desde servidor");
            return true;
        } else {
            rpg_mostrarAviso("No se encontró la partida en el servidor", "error");
            return false;
        }
    } catch (e) {
        console.error("[ApiGuardado] Error al cargar slot:", e.message);
        rpg_mostrarAviso("Error al cargar — intentando guardado local", "error");
        return DataManager.loadGame(slotId);
    }
}

//=============================================================================
// rpg_elegirYGuardar()
// Muestra el selector de slot para guardar. Llamar desde evento Script.
//=============================================================================

function rpg_elegirYGuardar() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesión iniciada", "error"); return; }
    _rpg_mostrarSelectorSlots("save",
        function(slotId) { rpg_guardarSlot(slotId); },
        null
    );
}

//=============================================================================
// PANTALLA DE TÍTULO — Continuar
// Intercepta el botón Continuar y muestra el selector de slots del servidor.
//=============================================================================

const _Scene_Title_commandContinue = Scene_Title.prototype.commandContinue;
Scene_Title.prototype.commandContinue = function() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) {
        // Sin sesión iniciada: pantalla de carga por defecto
        _Scene_Title_commandContinue.call(this);
        return;
    }

    this._commandWindow.deactivate();
    const scene = this;

    _rpg_mostrarSelectorSlots("load",
        function(slotId) {
            rpg_cargarSlot(slotId).then(function(exito) {
                if (exito) {
                    SoundManager.playLoad();
                    scene.fadeOutAll();
                    SceneManager.goto(Scene_Map);
                } else {
                    // Fallo: reactivar menú del título
                    scene._commandWindow.activate();
                }
            });
        },
        function() {
            // Cancelado: reactivar menú del título
            scene._commandWindow.activate();
        }
    );
};

//=============================================================================
// SELECTOR DE SLOTS — UI compartida para guardar y cargar
//=============================================================================

async function _rpg_mostrarSelectorSlots(modo, onSelect, onCancel) {
    // Obtener slots del servidor
    var slotsServidor = {};
    const usuario = localStorage.getItem("rpg_usuario");
    if (usuario) {
        try {
            const res = await fetch(
                `${API_BASE}/guardado/${encodeURIComponent(usuario)}/slots`,
                { headers: { "Accept": "application/json" } }
            );
            // listarSlots devuelve Map<Integer,String>: cada valor es un JSON string → parseamos
            if (res.ok) {
                const rawMap = await res.json();
                Object.keys(rawMap).forEach(function(k) {
                    try { slotsServidor[k] = JSON.parse(rawMap[k]); }
                    catch(e) { slotsServidor[k] = null; }
                });
            }
        } catch (e) {
            console.warn("[ApiGuardado] No se pudieron cargar los slots:", e.message);
        }
    }

    const anterior = document.getElementById("rpg-slot-panel");
    if (anterior) anterior.remove();

    // ── Backdrop ──────────────────────────────────────────────────────────────
    const backdrop = document.createElement("div");
    backdrop.id = "rpg-slot-panel";
    Object.assign(backdrop.style, {
        position:       "fixed",
        top:            "0", left: "0",
        width:          "100%", height: "100%",
        background:     "rgba(0,0,0,0.78)",
        zIndex:         "9998",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        opacity:        "0",
        transition:     "opacity 0.2s"
    });

    // ── Panel principal ───────────────────────────────────────────────────────
    const panel = document.createElement("div");
    Object.assign(panel.style, {
        background:   "rgba(8,12,24,0.97)",
        border:       "1px solid #c9a84c",
        borderRadius: "4px",
        padding:      "28px 36px 24px",
        minWidth:     "500px",
        maxWidth:     "620px",
        boxShadow:    "0 8px 40px rgba(0,0,0,0.85), 0 0 80px rgba(100,70,10,0.12)",
        fontFamily:   "'Cinzel',serif"
    });

    // Título
    const titElem = document.createElement("div");
    Object.assign(titElem.style, {
        color:         "#f0d080",
        fontSize:      "17px",
        letterSpacing: "0.14em",
        textAlign:     "center",
        marginBottom:  "18px",
        paddingBottom: "14px",
        borderBottom:  "1px solid rgba(201,168,76,0.3)"
    });
    titElem.textContent = modo === "save" ? "✦  Guardar Partida  ✦" : "✦  Cargar Partida  ✦";
    panel.appendChild(titElem);

    // ── Lista de slots ────────────────────────────────────────────────────────
    let slotSeleccionado = null;
    const entradas = [];

    for (var i = 1; i <= MAX_SLOTS; i++) {
        (function(slotId) {
            const datos   = slotsServidor[String(slotId)] || slotsServidor[slotId] || null;
            const vacio   = !datos || !datos.contenido;
            const inactivo = modo === "load" && vacio;

            const fila = document.createElement("div");
            Object.assign(fila.style, {
                display:      "flex",
                alignItems:   "center",
                padding:      "10px 14px",
                marginBottom: "8px",
                border:       "1px solid " + (vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)"),
                borderRadius: "3px",
                cursor:       inactivo ? "default" : "pointer",
                opacity:      inactivo ? "0.35" : "1",
                background:   "rgba(255,255,255,0.02)",
                transition:   "background 0.12s, border-color 0.12s"
            });

            // Número de slot
            const numElem = document.createElement("div");
            Object.assign(numElem.style, {
                color:         "#c9a84c",
                fontSize:      "12px",
                letterSpacing: "0.12em",
                minWidth:      "58px",
                textAlign:     "center",
                flexShrink:    "0"
            });
            numElem.textContent = "SLOT " + slotId;

            // Separador
            const sep = document.createElement("div");
            Object.assign(sep.style, {
                width:      "1px",
                height:     "38px",
                background: "rgba(201,168,76,0.22)",
                margin:     "0 16px",
                flexShrink: "0"
            });

            // Info
            const info = document.createElement("div");
            info.style.flex = "1";

            if (vacio) {
                const txt = document.createElement("div");
                Object.assign(txt.style, { color: "#555", fontSize: "13px", letterSpacing: "0.06em" });
                txt.textContent = "— Vacío —";
                info.appendChild(txt);
            } else {
                const mapa = document.createElement("div");
                Object.assign(mapa.style, {
                    color: "#f0d080", fontSize: "13px",
                    letterSpacing: "0.05em", marginBottom: "4px"
                });
                mapa.textContent = datos.titulo || "Sin título";

                const detalles = document.createElement("div");
                Object.assign(detalles.style, { display: "flex", gap: "18px", color: "#999", fontSize: "11px" });

                const nv  = document.createElement("span"); nv.textContent = "Nv. " + (datos.nivel || 1);
                const tm  = document.createElement("span"); tm.textContent = _formatearTiempo(datos.tiempo);
                const fch = document.createElement("span");
                fch.style.marginLeft = "auto";
                fch.textContent = _formatearFecha(datos.timestamp);

                detalles.appendChild(nv);
                detalles.appendChild(tm);
                detalles.appendChild(fch);
                info.appendChild(mapa);
                info.appendChild(detalles);
            }

            fila.appendChild(numElem);
            fila.appendChild(sep);
            fila.appendChild(info);

            if (!inactivo) {
                fila.addEventListener("mouseenter", function() {
                    if (fila !== slotSeleccionado) {
                        fila.style.background  = "rgba(201,168,76,0.09)";
                        fila.style.borderColor = "#c9a84c";
                    }
                });
                fila.addEventListener("mouseleave", function() {
                    if (fila !== slotSeleccionado) {
                        fila.style.background  = "rgba(255,255,255,0.02)";
                        fila.style.borderColor = vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)";
                    }
                });
                fila.addEventListener("click", function() {
                    entradas.forEach(function(e) {
                        e.el.style.background  = "rgba(255,255,255,0.02)";
                        e.el.style.borderColor = e.vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)";
                    });
                    slotSeleccionado           = fila;
                    fila.style.background      = "rgba(201,168,76,0.16)";
                    fila.style.borderColor     = "#f0d080";
                    btnConfirmar.style.opacity       = "1";
                    btnConfirmar.style.pointerEvents = "auto";
                    btnConfirmar.style.cursor        = "pointer";
                });
            }

            entradas.push({ el: fila, slotId: slotId, vacio: vacio });
            panel.appendChild(fila);
        })(i);
    }

    // ── Botones ───────────────────────────────────────────────────────────────
    const barraAcciones = document.createElement("div");
    Object.assign(barraAcciones.style, {
        display:        "flex",
        justifyContent: "center",
        gap:            "16px",
        marginTop:      "20px",
        paddingTop:     "16px",
        borderTop:      "1px solid rgba(201,168,76,0.2)"
    });

    const estiloBase = "font-family:'Cinzel',serif;font-size:13px;letter-spacing:0.1em;padding:10px 30px;border-radius:3px;transition:background 0.15s;";

    const btnConfirmar = document.createElement("button");
    btnConfirmar.style.cssText = estiloBase + "background:rgba(201,168,76,0.18);border:1px solid #c9a84c;color:#f0d080;opacity:0.35;pointer-events:none;cursor:default;";
    btnConfirmar.textContent   = modo === "save" ? "Guardar" : "Cargar";
    btnConfirmar.addEventListener("click", function() {
        const entrada = entradas.find(function(e) { return e.el === slotSeleccionado; });
        if (!entrada) return;
        backdrop.style.opacity = "0";
        setTimeout(function() { backdrop.remove(); }, 220);
        onSelect(entrada.slotId);
    });
    btnConfirmar.addEventListener("mouseenter", function() {
        if (btnConfirmar.style.pointerEvents !== "none")
            btnConfirmar.style.background = "rgba(201,168,76,0.32)";
    });
    btnConfirmar.addEventListener("mouseleave", function() {
        if (btnConfirmar.style.pointerEvents !== "none")
            btnConfirmar.style.background = "rgba(201,168,76,0.18)";
    });

    const btnCancelar = document.createElement("button");
    btnCancelar.style.cssText = estiloBase + "background:rgba(255,255,255,0.04);border:1px solid #555;color:#999;cursor:pointer;";
    btnCancelar.textContent   = "Cancelar";
    btnCancelar.addEventListener("click", function() {
        backdrop.style.opacity = "0";
        setTimeout(function() { backdrop.remove(); }, 220);
        if (onCancel) onCancel();
    });
    btnCancelar.addEventListener("mouseenter", function() { btnCancelar.style.background = "rgba(255,255,255,0.1)"; });
    btnCancelar.addEventListener("mouseleave", function() { btnCancelar.style.background = "rgba(255,255,255,0.04)"; });

    barraAcciones.appendChild(btnConfirmar);
    barraAcciones.appendChild(btnCancelar);
    panel.appendChild(barraAcciones);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    requestAnimationFrame(function() { backdrop.style.opacity = "1"; });
}

//=============================================================================
// CONTINUAR SIEMPRE ACTIVO SI HAY SESIÓN INICIADA
// DataManager.isAnySavefileExists() solo mira localStorage, lo que desactiva
// el botón "Continuar" si no hay guardado local aunque haya datos en servidor.
// Si hay sesión iniciada, forzamos el botón siempre activo.
//=============================================================================

const _DataManager_isAnySavefileExists = DataManager.isAnySavefileExists;
DataManager.isAnySavefileExists = function() {
    if (localStorage.getItem("rpg_usuario")) return true;
    return _DataManager_isAnySavefileExists.call(this);
};

//=============================================================================
// BLOQUEAR GUARDADO DESDE EL MENÚ
//=============================================================================

Scene_Menu.prototype.commandSave = function() {
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
};

//=============================================================================
// AVISO FLOTANTE
//=============================================================================

function rpg_mostrarAviso(mensaje, tipo) {
    tipo = tipo || "info";
    const anterior = document.getElementById("rpg-aviso");
    if (anterior) anterior.remove();

    const colores = {
        info:  { bg: "rgba(10,14,28,0.93)",  border: "#c9a84c", text: "#f0d080" },
        ok:    { bg: "rgba(10,22,14,0.93)",  border: "#4a9",    text: "#8de8b0" },
        error: { bg: "rgba(28,10,10,0.93)",  border: "#c44",    text: "#f4a4a4" }
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