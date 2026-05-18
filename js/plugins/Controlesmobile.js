//=============================================================================
// ControlesMobile.js
// Plugin unificado de controles táctiles para móvil
//
// Reemplaza a:
//   - Boton.js           (botón A en el mapa)
//   - BtnCmbCancelar.js  (botón X en combate)
//   - MBS_MobileDirPad.js (DPad / joystick de movimiento)
//   - MV3D_RightJoystick.js (joystick izquierdo)
//
// CONTROLES:
//   · Joystick dinámico  — mitad izquierda — movimiento del personaje
//   · Botón A (verde)    — mapa — acción / confirmar
//   · Botón 🎒 (dorado)  — SIEMPRE excepto en batalla — abre inventario
//   · Botón X (rojo)     — solo en batalla — cancelar / retroceder
//=============================================================================

(function() {

    'use strict';

    // =========================================================================
    // CONFIGURACIÓN — ajusta aquí tamaños y posiciones
    // =========================================================================

    var CFG = {
        // Joystick
        joystickRadius: 60,
        joystickDeadzone: 15,

        // Botón A (acción en mapa)
        btnASize:    120,
        btnAMarginR: 20,    // margen desde borde derecho
        btnAMarginB: 20,    // margen desde borde inferior
        btnAOffX:   -160,   // desplazamiento extra X
        btnAOffY:   -160,   // desplazamiento extra Y

        // Botón Mochila
        btnMochilaSize:    80,
        btnMochilaRight:   30,  // px desde borde derecho (CSS)
        btnMochilaBottom: 240,  // px desde borde inferior (CSS)

        // Botón X (cancelar en combate)
        btnXSize:    120,
        btnXMarginR: 20,
        btnXMarginB: 20,
        btnXOffX:   -160,
        btnXOffY:   -160,
    };

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    // Devuelve true SOLO en móvil/tablet real (no en PC aunque esté en modo test)
    function isMobile() {
        return Utils.isMobileDevice();
    }

    function dibujarCirculoConTexto(bmp, size, colorFondo, emoji, colorTexto) {
        var r = size / 2;
        bmp.drawCircle(r, r, r,     'rgba(0,0,0,0.3)');
        bmp.drawCircle(r, r, r - 2, colorFondo);
        bmp.fontSize     = Math.floor(size * 0.42);
        bmp.textColor    = colorTexto || 'white';
        bmp.outlineColor = 'rgba(0,0,0,0.6)';
        bmp.outlineWidth = 4;
        bmp.drawText(emoji, 0, 0, size, size, 'center');
    }

    // =========================================================================
    // JOYSTICK (HTML — mitad izquierda de la pantalla)
    // =========================================================================

    var _joystick = {
        active:     false,
        identifier: null,
        startX: 0, startY: 0,
        curX:   0, curY:   0
    };

    var _jContainer = null;
    var _jKnob      = null;

    function _crearJoystickDOM() {
        if (_jContainer) return;
        var r = CFG.joystickRadius;

        _jContainer = document.createElement('div');
        _jContainer.style.cssText = [
            'position:fixed',
            'width:'  + (r * 2) + 'px',
            'height:' + (r * 2) + 'px',
            'background:rgba(255,255,255,0.10)',
            'border:2px solid rgba(255,255,255,0.30)',
            'border-radius:50%',
            'display:none',
            'z-index:100000',
            'touch-action:none',
            'pointer-events:none'
        ].join(';');

        _jKnob = document.createElement('div');
        _jKnob.style.cssText = [
            'position:absolute',
            'width:40px',
            'height:40px',
            'background:rgba(255,255,255,0.70)',
            'border-radius:50%',
            'top:50%',
            'left:50%',
            'transform:translate(-50%,-50%)',
            'box-shadow:0 0 8px rgba(0,0,0,0.5)'
        ].join(';');

        _jContainer.appendChild(_jKnob);
        document.body.appendChild(_jContainer);
    }

    function _onTouchStart(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.clientX < window.innerWidth / 2) {
                e.stopImmediatePropagation();
                if (!_joystick.active) {
                    _joystick.active     = true;
                    _joystick.identifier = t.identifier;
                    _joystick.startX     = t.clientX;
                    _joystick.startY     = t.clientY;
                    _joystick.curX       = 0;
                    _joystick.curY       = 0;
                    var r = CFG.joystickRadius;
                    _jContainer.style.left    = (t.clientX - r) + 'px';
                    _jContainer.style.top     = (t.clientY - r) + 'px';
                    _jContainer.style.display = 'block';
                }
            }
        }
    }

    function _onTouchMove(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier === _joystick.identifier) {
                e.stopImmediatePropagation();
                var dx   = t.clientX - _joystick.startX;
                var dy   = t.clientY - _joystick.startY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var r    = CFG.joystickRadius;
                if (dist > r) { dx *= r / dist; dy *= r / dist; }
                _joystick.curX = dx;
                _joystick.curY = dy;
                _jKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            } else if (t.clientX < window.innerWidth / 2) {
                e.stopImmediatePropagation();
            }
        }
    }

    function _onTouchEnd(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier === _joystick.identifier) {
                e.stopImmediatePropagation();
                _joystick.active     = false;
                _joystick.identifier = null;
                _joystick.curX       = 0;
                _joystick.curY       = 0;
                _jContainer.style.display = 'none';
                _jKnob.style.transform    = 'translate(-50%, -50%)';
                // Liberar todas las teclas de dirección
                ['up','down','left','right'].forEach(function(k) {
                    Input._currentState[k] = false;
                });
            } else if (t.clientX < window.innerWidth / 2) {
                e.stopImmediatePropagation();
            }
        }
    }

    // Conectar joystick con el sistema de movimiento de RPG Maker
    var _orig_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (_joystick.active) {
            var dx   = _joystick.curX;
            var dy   = _joystick.curY;
            var dead = CFG.joystickDeadzone;
            if (Math.sqrt(dx * dx + dy * dy) < dead) return 0;
            if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 6 : 4;
            return dy > 0 ? 2 : 8;
        }
        return _orig_getInputDirection ? _orig_getInputDirection.call(this) : Input.dir8;
    };

    // Añadir/quitar listeners con la escena del mapa
    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (!isMobile()) return; // Solo en móvil/tablet
        _crearJoystickDOM();
        document.addEventListener('touchstart',  _onTouchStart, { passive: false, capture: true });
        document.addEventListener('touchmove',   _onTouchMove,  { passive: false, capture: true });
        document.addEventListener('touchend',    _onTouchEnd,   { passive: false, capture: true });
        document.addEventListener('touchcancel', _onTouchEnd,   { passive: false, capture: true });
    };

    var _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        _Scene_Map_terminate.call(this);
        if (!isMobile()) return;
        document.removeEventListener('touchstart',  _onTouchStart, true);
        document.removeEventListener('touchmove',   _onTouchMove,  true);
        document.removeEventListener('touchend',    _onTouchEnd,   true);
        document.removeEventListener('touchcancel', _onTouchEnd,   true);
        if (_jContainer) _jContainer.style.display = 'none';
    };

    // Deshabilitar click-to-move en móvil para no interferir con el joystick
    var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (isMobile()) return; // En móvil lo gestiona el joystick
        _Scene_Map_processMapTouch.call(this);
    };

    // =========================================================================
    // BOTÓN MOCHILA (HTML — persistente en todas las escenas excepto batalla)
    // =========================================================================

    var _btnMochila = null;

    function _crearMochilaDOM() {
        if (_btnMochila) return;

        var s = CFG.btnMochilaSize;

        _btnMochila = document.createElement('div');
        _btnMochila.style.cssText = [
            'position:fixed',
            'right:'   + CFG.btnMochilaRight  + 'px',
            'bottom:'  + CFG.btnMochilaBottom + 'px',
            'width:'   + s + 'px',
            'height:'  + s + 'px',
            'background:radial-gradient(circle, rgba(30,20,8,0.85) 60%, rgba(10,7,3,0.70) 100%)',
            'border:2px solid rgba(201,168,76,0.75)',
            'border-radius:50%',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'font-size:' + Math.floor(s * 0.46) + 'px',
            'z-index:99990',
            'cursor:pointer',
            'user-select:none',
            '-webkit-user-select:none',
            'touch-action:manipulation',
            'box-shadow:0 3px 12px rgba(0,0,0,0.5)',
            'transition:opacity 0.15s'
        ].join(';');
        _btnMochila.textContent = '\uD83C\uDF92'; // 🎒

        _btnMochila.addEventListener('click', _abrirInventario);
        _btnMochila.addEventListener('touchend', function(e) {
            e.preventDefault();
            _abrirInventario();
        });

        document.body.appendChild(_btnMochila);
    }

    function _abrirInventario() {
        if (!$gameSystem  || !$gameSystem.isMenuEnabled()) return;
        if (!$gameMessage || $gameMessage.isBusy())        return;
        if (SceneManager.isSceneChanging())                return;
        SoundManager.playOk();
        SceneManager.push(Scene_Item);
    }

    function _actualizarVisibilidadMochila() {
        if (!_btnMochila) return;
        var enBatalla = SceneManager._scene instanceof Scene_Battle;
        _btnMochila.style.display = enBatalla ? 'none' : 'flex';
    }

    // Crear el botón al arrancar el juego y actualizarlo cada escena
    var _Scene_Base_start = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        _Scene_Base_start.call(this);
        if (!isMobile()) return; // Solo en móvil/tablet
        _crearMochilaDOM();
        _actualizarVisibilidadMochila();
    };

    // =========================================================================
    // BOTÓN A — acción / confirmar (en el mapa)
    // =========================================================================

    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._crearBotonA();
    };

    Scene_Map.prototype._crearBotonA = function() {
        if (!isMobile()) return; // Solo en móvil/tablet
        var s   = CFG.btnASize;
        var bmp = new Bitmap(s, s);
        dibujarCirculoConTexto(bmp, s, 'green', 'A', 'white');

        this._botonA        = new Sprite_Button();
        this._botonA.bitmap = bmp;
        this._botonA.x      = Graphics.width  - s - CFG.btnAMarginR + CFG.btnAOffX;
        this._botonA.y      = Graphics.height - s - CFG.btnAMarginB + CFG.btnAOffY;

        this._botonA.setClickHandler(function() {
            Input._currentState['ok'] = true;
            setTimeout(function() { Input._currentState['ok'] = false; }, 100);
        });

        this.addChild(this._botonA);
    };

    // Ocultar botón A cuando hay mensajes activos
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this._botonA) {
            this._botonA.visible = !$gameMessage.isBusy();
        }
    };

    // =========================================================================
    // BOTÓN X — cancelar (solo en batalla)
    // =========================================================================

    var _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
    Scene_Battle.prototype.createDisplayObjects = function() {
        _Scene_Battle_createDisplayObjects.call(this);
        this._crearBotonX();
    };

    Scene_Battle.prototype._crearBotonX = function() {
        if (!isMobile()) return; // Solo en móvil/tablet
        var s   = CFG.btnXSize;
        var bmp = new Bitmap(s, s);
        dibujarCirculoConTexto(bmp, s, 'red', 'X', 'white');

        this._botonX        = new Sprite_Button();
        this._botonX.bitmap = bmp;
        this._botonX.x      = Graphics.width  - s - CFG.btnXMarginR + CFG.btnXOffX;
        this._botonX.y      = Graphics.height - s - CFG.btnXMarginB + CFG.btnXOffY;

        this._botonX.setClickHandler(function() {
            SoundManager.playCancel();
            Input._currentState['cancel'] = true;
            setTimeout(function() { Input._currentState['cancel'] = false; }, 100);
        });

        this.addChild(this._botonX);
    };

})();