//=============================================================================
// ApiGuardado.js — Slots de guardado en el servidor con UI de selección
//=============================================================================

const API_BASE  = "https://marcovarasperez.duckdns.org/api/jugadores";
const MAX_SLOTS = 5;

//=============================================================================
// CACHE DE SLOTS DEL SERVIDOR
//=============================================================================

var _slotsServidor = {};

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

// Info compatible con Window_SavefileList construida desde datos del servidor
function _construirInfoParaMostrar(datos) {
    var seg = Math.floor((datos.tiempo || 0) / 60);
    var h   = Math.floor(seg / 3600);
    var m   = Math.floor((seg % 3600) / 60);
    var s   = seg % 60;
    return {
        globalId:   '_',
        title:      datos.titulo || "Sin titulo",
        characters: [],
        faces:      [],
        playtime:   h + ":" + String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0'),
        timestamp:  datos.timestamp || 0
    };
}

// Overlay de espera mientras se consulta el servidor
function _mostrarCargando() {
    var div = document.createElement("div");
    div.id  = "rpg-cargando";
    div.style.cssText = [
        "position:fixed","top:0","left:0","width:100%","height:100%",
        "background:rgba(0,0,0,0.6)","z-index:99999",
        "display:flex","align-items:center","justify-content:center",
        "font-family:'Cinzel',serif","font-size:16px",
        "letter-spacing:0.14em","color:#f0d080","pointer-events:all"
    ].join(";");
    div.textContent = "Cargando partidas...";
    document.body.appendChild(div);
    return div;
}

//=============================================================================
// HOOK AUTOMATICO — DataManager.saveGame
//=============================================================================

const _DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function(savefileId) {
    const resultado = _DataManager_saveGame.call(this, savefileId);
    const usuario   = localStorage.getItem("rpg_usuario");
    if (usuario) {
        fetch(API_BASE + "/guardado/" + encodeURIComponent(usuario) + "/slot/" + savefileId, {
            method:  "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body:    JSON.stringify(_construirDatosSlot())
        }).catch(function(e) {
            console.error("[ApiGuardado] Error al guardar slot:", e.message);
        });
    }
    return resultado;
};

//=============================================================================
// DataManager.savefileInfo — inyecta datos del servidor en slots vacios
//=============================================================================

const _orig_savefileInfo = DataManager.savefileInfo;
DataManager.savefileInfo = function(savefileId) {
    var local = _orig_savefileInfo.call(this, savefileId);
    if (local) return local;
    var serv = _slotsServidor[String(savefileId)] || _slotsServidor[savefileId] || null;
    if (serv && serv.contenido) return _construirInfoParaMostrar(serv);
    return null;
};

//=============================================================================
// rpg_guardarSlot(slotId)
//=============================================================================

async function rpg_guardarSlot(slotId) {
    slotId = slotId || 1;
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesion iniciada", "error"); return false; }
    try {
        const res = await fetch(
            API_BASE + "/guardado/" + encodeURIComponent(usuario) + "/slot/" + slotId,
            { method: "PUT", headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify(_construirDatosSlot()) }
        );
        if (res.ok) {
            _DataManager_saveGame.call(DataManager, slotId);
            rpg_mostrarAviso("Partida guardada en el Slot " + slotId, "ok");
            return true;
        } else {
            rpg_mostrarAviso("Error al guardar la partida", "error");
            return false;
        }
    } catch (e) {
        console.error("[ApiGuardado] Sin conexion:", e.message);
        _DataManager_saveGame.call(DataManager, slotId);
        rpg_mostrarAviso("Sin conexion - guardado solo local", "error");
        return false;
    }
}

//=============================================================================
// rpg_cargarSlot(slotId)
//=============================================================================

async function rpg_cargarSlot(slotId) {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesion iniciada", "error"); return false; }
    try {
        const res = await fetch(
            API_BASE + "/guardado/" + encodeURIComponent(usuario) + "/slot/" + slotId,
            { headers: { "Accept": "application/json" } }
        );
        if (res.ok) {
            const datosSlot = await res.json();
            const contenido = JsonEx.parse(LZString.decompressFromBase64(datosSlot.contenido));
            DataManager.createGameObjects();
            DataManager.extractSaveContents(contenido);
            DataManager._lastAccessedId = slotId;
            console.log("[ApiGuardado] Slot " + slotId + " cargado desde servidor");
            return true;
        } else {
            rpg_mostrarAviso("No se encontro la partida en el servidor", "error");
            return false;
        }
    } catch (e) {
        console.error("[ApiGuardado] Error al cargar slot:", e.message);
        rpg_mostrarAviso("Error al cargar - intentando guardado local", "error");
        return DataManager.loadGame(slotId);
    }
}

//=============================================================================
// rpg_elegirYGuardar() — selector HTML para guardar (desde evento Script)
//=============================================================================

function rpg_elegirYGuardar() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) { rpg_mostrarAviso("No hay sesion iniciada", "error"); return; }
    _rpg_mostrarSelectorSlots("save", function(slotId) { rpg_guardarSlot(slotId); }, null);
}

//=============================================================================
// PANTALLA DE TITULO — Continuar
// Descarga los slots del servidor y abre el selector NATIVO Scene_Load.
//=============================================================================

const _Scene_Title_commandContinue = Scene_Title.prototype.commandContinue;
Scene_Title.prototype.commandContinue = function() {
    const usuario = localStorage.getItem("rpg_usuario");
    if (!usuario) {
        _Scene_Title_commandContinue.call(this);
        return;
    }

    this._commandWindow.deactivate();
    var overlay = _mostrarCargando();

    fetch(API_BASE + "/guardado/" + encodeURIComponent(usuario) + "/slots",
          { headers: { "Accept": "application/json" } })
    .then(function(res) { return res.ok ? res.json() : Promise.resolve({}); })
    .then(function(rawMap) {
        _slotsServidor = {};
        Object.keys(rawMap).forEach(function(k) {
            try   { _slotsServidor[k] = JSON.parse(rawMap[k]); }
            catch (e) { _slotsServidor[k] = null; }
        });
    })
    .catch(function() { _slotsServidor = {}; })
    .then(function() {
        overlay.remove();
        SceneManager.push(Scene_Load);
    });
};

//=============================================================================
// Scene_Load — carga desde servidor al confirmar un slot
//=============================================================================

const _Scene_Load_onSavefileOk = Scene_Load.prototype.onSavefileOk;
Scene_Load.prototype.onSavefileOk = function() {
    var slotId = this.savefileId();
    var serv   = _slotsServidor[String(slotId)] || _slotsServidor[slotId] || null;

    if (serv && serv.contenido) {
        // Datos en servidor — carga asincrona
        if (this._listWindow) this._listWindow.deactivate();
        var overlay = _mostrarCargando();
        var scene   = this;

        rpg_cargarSlot(slotId).then(function(exito) {
            overlay.remove();
            if (exito) {
                scene.onLoadSuccess();
            } else {
                if (DataManager.loadGame(slotId)) {
                    scene.onLoadSuccess();
                } else {
                    SoundManager.playBuzzer();
                    if (scene._listWindow) scene._listWindow.activate();
                }
            }
        });
    } else {
        // Sin datos en servidor — carga local nativa
        _Scene_Load_onSavefileOk.call(this);
    }
};

//=============================================================================
// CONTINUAR SIEMPRE ACTIVO SI HAY SESION
//=============================================================================

const _DataManager_isAnySavefileExists = DataManager.isAnySavefileExists;
DataManager.isAnySavefileExists = function() {
    if (localStorage.getItem("rpg_usuario")) return true;
    return _DataManager_isAnySavefileExists.call(this);
};

//=============================================================================
// BLOQUEAR GUARDADO DESDE EL MENU
//=============================================================================

Scene_Menu.prototype.commandSave = function() {
    SoundManager.playBuzzer();
    this.popScene();
    rpg_mostrarAviso("Debes guardar en un punto de control", "info");
};

//=============================================================================
// SELECTOR DE SLOTS HTML — solo para guardar (rpg_elegirYGuardar)
//=============================================================================

async function _rpg_mostrarSelectorSlots(modo, onSelect, onCancel) {
    var slotsLocal = {};
    const usuario = localStorage.getItem("rpg_usuario");
    if (usuario) {
        try {
            const res = await fetch(
                API_BASE + "/guardado/" + encodeURIComponent(usuario) + "/slots",
                { headers: { "Accept": "application/json" } }
            );
            if (res.ok) {
                const rawMap = await res.json();
                Object.keys(rawMap).forEach(function(k) {
                    try { slotsLocal[k] = JSON.parse(rawMap[k]); }
                    catch(e) { slotsLocal[k] = null; }
                });
            }
        } catch (e) {
            console.warn("[ApiGuardado] No se pudieron cargar los slots:", e.message);
        }
    }

    const anterior = document.getElementById("rpg-slot-panel");
    if (anterior) anterior.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "rpg-slot-panel";
    Object.assign(backdrop.style, {
        position: "fixed", top: "0", left: "0",
        width: "100%", height: "100%",
        background: "rgba(0,0,0,0.78)", zIndex: "9998",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: "0", transition: "opacity 0.2s"
    });

    const panel = document.createElement("div");
    Object.assign(panel.style, {
        background: "rgba(8,12,24,0.97)", border: "1px solid #c9a84c",
        borderRadius: "4px", padding: "28px 36px 24px",
        minWidth: "500px", maxWidth: "620px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.85)",
        fontFamily: "'Cinzel',serif"
    });

    const titElem = document.createElement("div");
    Object.assign(titElem.style, {
        color: "#f0d080", fontSize: "17px", letterSpacing: "0.14em",
        textAlign: "center", marginBottom: "18px", paddingBottom: "14px",
        borderBottom: "1px solid rgba(201,168,76,0.3)"
    });
    titElem.textContent = "Guardar Partida";
    panel.appendChild(titElem);

    let slotSeleccionado = null;
    const entradas = [];

    for (var i = 1; i <= MAX_SLOTS; i++) {
        (function(slotId) {
            const datos  = slotsLocal[String(slotId)] || slotsLocal[slotId] || null;
            const vacio  = !datos || !datos.contenido;

            const fila = document.createElement("div");
            Object.assign(fila.style, {
                display: "flex", alignItems: "center",
                padding: "10px 14px", marginBottom: "8px",
                border: "1px solid " + (vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)"),
                borderRadius: "3px", cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
                transition: "background 0.12s, border-color 0.12s"
            });

            const numElem = document.createElement("div");
            Object.assign(numElem.style, {
                color: "#c9a84c", fontSize: "12px", letterSpacing: "0.12em",
                minWidth: "58px", textAlign: "center", flexShrink: "0"
            });
            numElem.textContent = "SLOT " + slotId;

            const sep = document.createElement("div");
            Object.assign(sep.style, {
                width: "1px", height: "38px",
                background: "rgba(201,168,76,0.22)", margin: "0 16px", flexShrink: "0"
            });

            const info = document.createElement("div");
            info.style.flex = "1";

            if (vacio) {
                const txt = document.createElement("div");
                Object.assign(txt.style, { color: "#555", fontSize: "13px" });
                txt.textContent = "Vacio";
                info.appendChild(txt);
            } else {
                const mapa = document.createElement("div");
                Object.assign(mapa.style, { color: "#f0d080", fontSize: "13px", marginBottom: "4px" });
                mapa.textContent = datos.titulo || "Sin titulo";
                const detalles = document.createElement("div");
                Object.assign(detalles.style, { display: "flex", gap: "18px", color: "#999", fontSize: "11px" });
                const nv  = document.createElement("span"); nv.textContent  = "Nv. " + (datos.nivel || 1);
                const tm  = document.createElement("span"); tm.textContent  = _formatearTiempo(datos.tiempo);
                const fch = document.createElement("span");
                fch.style.marginLeft = "auto";
                fch.textContent = _formatearFecha(datos.timestamp);
                detalles.appendChild(nv); detalles.appendChild(tm); detalles.appendChild(fch);
                info.appendChild(mapa); info.appendChild(detalles);
            }

            fila.appendChild(numElem); fila.appendChild(sep); fila.appendChild(info);

            fila.addEventListener("mouseenter", function() {
                if (fila !== slotSeleccionado) {
                    fila.style.background = "rgba(201,168,76,0.09)";
                    fila.style.borderColor = "#c9a84c";
                }
            });
            fila.addEventListener("mouseleave", function() {
                if (fila !== slotSeleccionado) {
                    fila.style.background = "rgba(255,255,255,0.02)";
                    fila.style.borderColor = vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)";
                }
            });
            fila.addEventListener("click", function() {
                entradas.forEach(function(e) {
                    e.el.style.background  = "rgba(255,255,255,0.02)";
                    e.el.style.borderColor = e.vacio ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.5)";
                });
                slotSeleccionado = fila;
                fila.style.background  = "rgba(201,168,76,0.16)";
                fila.style.borderColor = "#f0d080";
                btnConfirmar.style.opacity      = "1";
                btnConfirmar.style.pointerEvents = "auto";
                btnConfirmar.style.cursor       = "pointer";
            });

            entradas.push({ el: fila, slotId: slotId, vacio: vacio });
            panel.appendChild(fila);
        })(i);
    }

    const barraAcciones = document.createElement("div");
    Object.assign(barraAcciones.style, {
        display: "flex", justifyContent: "center", gap: "16px",
        marginTop: "20px", paddingTop: "16px",
        borderTop: "1px solid rgba(201,168,76,0.2)"
    });

    const estiloBase = "font-family:'Cinzel',serif;font-size:13px;letter-spacing:0.1em;padding:10px 30px;border-radius:3px;transition:background 0.15s;";

    const btnConfirmar = document.createElement("button");
    btnConfirmar.style.cssText = estiloBase + "background:rgba(201,168,76,0.18);border:1px solid #c9a84c;color:#f0d080;opacity:0.35;pointer-events:none;cursor:default;";
    btnConfirmar.textContent = "Guardar";
    btnConfirmar.addEventListener("click", function() {
        const entrada = entradas.find(function(e) { return e.el === slotSeleccionado; });
        if (!entrada) return;
        backdrop.style.opacity = "0";
        setTimeout(function() { backdrop.remove(); }, 220);
        onSelect(entrada.slotId);
    });

    const btnCancelar = document.createElement("button");
    btnCancelar.style.cssText = estiloBase + "background:rgba(255,255,255,0.04);border:1px solid #555;color:#999;cursor:pointer;";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.addEventListener("click", function() {
        backdrop.style.opacity = "0";
        setTimeout(function() { backdrop.remove(); }, 220);
        if (onCancel) onCancel();
    });

    barraAcciones.appendChild(btnConfirmar);
    barraAcciones.appendChild(btnCancelar);
    panel.appendChild(barraAcciones);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function() { backdrop.style.opacity = "1"; });
}

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
        "position:fixed","bottom:60px","left:50%","transform:translateX(-50%)",
        "background:" + c.bg,"border:1px solid " + c.border,"color:" + c.text,
        "font-family:'Cinzel',serif","font-size:14px","letter-spacing:0.08em",
        "padding:12px 28px","border-radius:3px","z-index:9999",
        "pointer-events:none","opacity:0","transition:opacity 0.3s","white-space:nowrap",
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