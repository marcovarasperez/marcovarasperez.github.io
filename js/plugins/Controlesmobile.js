//=============================================================================
// ControlesMobile.js — Controles táctiles unificados
/*:
 * @plugindesc Controles táctiles unificados para móvil y tablet.
 * Pon este plugin el ÚLTIMO de la lista.
 * @author Fix
 *
 * @param Forzar Movil
 * @desc true = activa controles siempre. Úsalo si no se detecta el móvil.
 * @default false
 */
//=============================================================================

(function() {

    'use strict';

    // =========================================================================
    // CONFIGURACIÓN
    // =========================================================================
    var CFG = {
        joystickRadius:   60,
        joystickDeadzone: 15,

        btnASize:    110,
        btnARight:    30,   // px desde borde derecho del canvas (CSS relativo)
        btnABottom:   30,   // px desde borde inferior del canvas (CSS relativo)

        btnMochilaSize:   70,
        btnMochilaRight:  15,
        btnMochilaTop:    15,

        btnAtrasSize:     70,
        btnAtrasLeft:     15,
        btnAtrasTop:      15,

        btnXSize:    110,
        btnXRight:    30,
        btnXBottom:   30,
    };

    // =========================================================================
    // DETECCIÓN DE MÓVIL
    // =========================================================================
    var _params      = PluginManager.parameters('ControlesMobile') || {};
    var _forzarMovil = String(_params['Forzar Movil'] || 'false').toLowerCase() === 'true';
    var _isMobileCache = null;

    function isMobile() {
        if (_isMobileCache !== null) return _isMobileCache;
        if (_forzarMovil) return (_isMobileCache = true);
        if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0)
            return (_isMobileCache = true);
        if (typeof navigator.msMaxTouchPoints === 'number' && navigator.msMaxTouchPoints > 0)
            return (_isMobileCache = true);
        if ('ontouchstart' in window)
            return (_isMobileCache = true);
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
            return (_isMobileCache = true);
        if (Utils.isMobileDevice())
            return (_isMobileCache = true);
        return (_isMobileCache = false);
    }

    // =========================================================================
    // BLOQUEAR ZOOM Y TOQUES FUERA DEL CANVAS
    // =========================================================================

    // Meta viewport: bloquea zoom del navegador
    (function() {
        var meta = document.querySelector('meta[name=viewport]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    })();

    // Bloquear gestos de pinch-zoom y doble toque
    document.addEventListener('gesturestart',  function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend',    function(e) { e.preventDefault(); }, { passive: false });

    // Comprobar si un punto (clientX, clientY) está dentro del canvas
    function _dentroDelCanvas(cx, cy) {
        var canvas = Graphics._canvas;
        if (!canvas) return true;
        var r = canvas.getBoundingClientRect();
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    }

    // Bloquear touches fuera del canvas (márgenes negros)
    // Se añade globalmente al inicio del juego
    document.addEventListener('touchstart', function(e) {
        var bloquear = true;
        for (var i = 0; i < e.touches.length; i++) {
            if (_dentroDelCanvas(e.touches[i].clientX, e.touches[i].clientY)) {
                bloquear = false;
                break;
            }
        }
        // Pinch con 2 dedos: bloquear siempre (evita zoom)
        if (e.touches.length >= 2) {
            e.preventDefault();
            return;
        }
        if (bloquear) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, { passive: false, capture: true });

    document.addEventListener('touchmove', function(e) {
        if (e.touches.length >= 2) {
            e.preventDefault();
        }
    }, { passive: false });

    // =========================================================================
    // JOYSTICK HTML (mitad izquierda del canvas)
    // =========================================================================
    var _joystick = { active: false, identifier: null, startX: 0, startY: 0, curX: 0, curY: 0 };
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
            'background:rgba(255,255,255,0.08)',
            'border:2px solid rgba(255,255,255,0.25)',
            'border-radius:50%',
            'display:none',
            'z-index:100000',
            'touch-action:none',
            'pointer-events:none'
        ].join(';');

        _jKnob = document.createElement('div');
        _jKnob.style.cssText = [
            'position:absolute',
            'width:44px', 'height:44px',
            'background:radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(180,180,180,0.6))',
            'border-radius:50%',
            'top:50%', 'left:50%',
            'transform:translate(-50%,-50%)',
            'box-shadow:0 2px 8px rgba(0,0,0,0.5)'
        ].join(';');

        _jContainer.appendChild(_jKnob);
        document.body.appendChild(_jContainer);
    }

    function _canvasLeft()   { var c = Graphics._canvas; return c ? c.getBoundingClientRect().left  : 0; }
    function _canvasMidX()   { var c = Graphics._canvas; return c ? c.getBoundingClientRect().left + c.getBoundingClientRect().width / 2 : window.innerWidth / 2; }

    function _onTouchStart(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            // Solo actuar si el dedo está dentro del canvas Y en la mitad izquierda
            if (!_dentroDelCanvas(t.clientX, t.clientY)) continue;
            if (t.clientX > _canvasMidX()) continue;
            e.stopImmediatePropagation();
            if (!_joystick.active) {
                _joystick.active     = true;
                _joystick.identifier = t.identifier;
                _joystick.startX     = t.clientX;
                _joystick.startY     = t.clientY;
                _joystick.curX = _joystick.curY = 0;
                var r = CFG.joystickRadius;
                _jContainer.style.left    = (t.clientX - r) + 'px';
                _jContainer.style.top     = (t.clientY - r) + 'px';
                _jContainer.style.display = 'block';
            }
        }
    }

    function _onTouchMove(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier !== _joystick.identifier) continue;
            e.stopImmediatePropagation();
            var dx = t.clientX - _joystick.startX;
            var dy = t.clientY - _joystick.startY;
            var dist = Math.sqrt(dx*dx + dy*dy);
            var r = CFG.joystickRadius;
            if (dist > r) { dx *= r/dist; dy *= r/dist; }
            _joystick.curX = dx;
            _joystick.curY = dy;
            _jKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        }
    }

    function _onTouchEnd(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier !== _joystick.identifier) continue;
            e.stopImmediatePropagation();
            _joystick.active = false;
            _joystick.identifier = null;
            _joystick.curX = _joystick.curY = 0;
            _jContainer.style.display = 'none';
            _jKnob.style.transform = 'translate(-50%,-50%)';
            ['up','down','left','right'].forEach(function(k) { Input._currentState[k] = false; });
        }
    }

    var _orig_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (_joystick.active) {
            var dx = _joystick.curX, dy = _joystick.curY;
            if (Math.sqrt(dx*dx + dy*dy) < CFG.joystickDeadzone) return 0;
            if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 6 : 4;
            return dy > 0 ? 2 : 8;
        }
        return _orig_getInputDirection ? _orig_getInputDirection.call(this) : Input.dir8;
    };

    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (!isMobile()) return;
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

    var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (isMobile()) return;
        _Scene_Map_processMapTouch.call(this);
    };

    // =========================================================================
    // BOTÓN A — acción / confirmar / avanzar diálogos
    // Siempre visible en el mapa. Durante diálogos avanza el mensaje.
    // =========================================================================

    function _dibujarBotonA(bmp, size) {
        var r   = size / 2;
        var ctx = bmp._context;

        // Sombra exterior
        ctx.beginPath();
        ctx.arc(r, r, r - 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();

        // Gradiente principal azul oscuro
        var grad = ctx.createRadialGradient(r - size*0.15, r - size*0.15, size*0.05, r, r, r - 4);
        grad.addColorStop(0, '#4a90d9');
        grad.addColorStop(0.5, '#1a5fa8');
        grad.addColorStop(1, '#0d3d72');
        ctx.beginPath();
        ctx.arc(r, r, r - 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Brillo superior
        var shineGrad = ctx.createRadialGradient(r, r * 0.4, 0, r, r * 0.4, r * 0.6);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(r, r, r - 4, 0, Math.PI * 2);
        ctx.fillStyle = shineGrad;
        ctx.fill();

        // Borde exterior refinado
        ctx.beginPath();
        ctx.arc(r, r, r - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,160,255,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Letra A
        bmp.fontSize     = Math.floor(size * 0.44);
        bmp.textColor    = '#ffffff';
        bmp.outlineColor = 'rgba(0,30,80,0.8)';
        bmp.outlineWidth = 4;
        bmp.drawText('A', 0, -Math.floor(size * 0.02), size, size, 'center');
    }

    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._crearBotonA();
    };

    Scene_Map.prototype._crearBotonA = function() {
        if (!isMobile()) return;
        var s   = CFG.btnASize;
        var bmp = new Bitmap(s, s);
        _dibujarBotonA(bmp, s);

        this._botonA        = new Sprite_Button();
        this._botonA.bitmap = bmp;
        // Posición relativa al canvas: esquina inferior derecha
        this._botonA.x = Graphics.width  - s - CFG.btnARight;
        this._botonA.y = Graphics.height - s - CFG.btnABottom;

        this._botonA.setClickHandler(function() {
            Input._currentState['ok'] = true;
            setTimeout(function() { Input._currentState['ok'] = false; }, 100);
        });

        this.addChild(this._botonA);
    };

    // Botón A siempre visible — durante diálogos también funciona para avanzar
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this._botonA) {
            this._botonA.visible = true; // siempre visible en el mapa
        }
    };

    // =========================================================================
    // BOTÓN MOCHILA (HTML — siempre excepto batalla)
    // =========================================================================
    var _btnMochila = null;

    function _crearMochilaDOM() {
        if (_btnMochila) return;
        var s = CFG.btnMochilaSize;
        _btnMochila = document.createElement('div');
        _btnMochila.style.cssText = [
            'position:fixed',
            'right:'  + CFG.btnMochilaRight + 'px',
            'top:'    + CFG.btnMochilaTop   + 'px',
            'width:'  + s + 'px',
            'height:' + s + 'px',
            'background:radial-gradient(circle, rgba(30,20,8,0.88) 60%, rgba(10,7,3,0.72) 100%)',
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
            'transition:transform 0.1s'
        ].join(';');
        _btnMochila.textContent = '\uD83C\uDF92';
        _btnMochila.addEventListener('click', _toggleInventario);
        _btnMochila.addEventListener('touchend', function(e) {
            e.preventDefault();
            _toggleInventario();
        });
        document.body.appendChild(_btnMochila);
    }

    function _toggleInventario() {
        if (SceneManager.isSceneChanging()) return;
        // Si ya estamos en el inventario, volver atrás
        if (SceneManager._scene instanceof Scene_Item) {
            SoundManager.playCancel();
            SceneManager.pop();
            return;
        }
        // Si estamos en otro menú (skill, equip, status...), no hacer nada
        if (SceneManager._scene instanceof Scene_MenuBase) return;
        if (!$gameSystem  || !$gameSystem.isMenuEnabled()) return;
        if (!$gameMessage || $gameMessage.isBusy())        return;
        SoundManager.playOk();
        SceneManager.push(Scene_Item);
    }

    function _actualizarVisibilidadMochila() {
        if (!_btnMochila) return;
        var escena = SceneManager._scene;
        var ocultar = (escena instanceof Scene_Battle) ||
                      (escena instanceof Scene_Boot)   ||
                      (escena instanceof Scene_Title);
        _btnMochila.style.display = ocultar ? 'none' : 'flex';
    }

    var _Scene_Base_start = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        _Scene_Base_start.call(this);
        if (!isMobile()) return;
        _crearMochilaDOM();
        _crearAtrasDOM();
        _actualizarVisibilidadMochila();
        _actualizarVisibilidadAtras();
    };

    // =========================================================================
    // BOTÓN ATRÁS (HTML — visible en cualquier menú/opciones)
    // =========================================================================
    var _btnAtras = null;

    // Escenas donde el botón atrás tiene sentido
    function _esEscenaConAtras() {
        var s = SceneManager._scene;
        if (!s) return false;
        return (s instanceof Scene_Menu)    ||
               (s instanceof Scene_Item)    ||
               (s instanceof Scene_Skill)   ||
               (s instanceof Scene_Equip)   ||
               (s instanceof Scene_Status)  ||
               (s instanceof Scene_Options) ||
               (s instanceof Scene_File)    ||
               (s instanceof Scene_GameEnd) ||
               (typeof Scene_Save    !== 'undefined' && s instanceof Scene_Save)   ||
               (typeof Scene_Load    !== 'undefined' && s instanceof Scene_Load);
    }

    function _crearAtrasDOM() {
        if (_btnAtras) return;
        var s = CFG.btnAtrasSize;
        _btnAtras = document.createElement('div');
        _btnAtras.style.cssText = [
            'position:fixed',
            'left:'   + CFG.btnAtrasLeft + 'px',
            'top:'    + CFG.btnAtrasTop  + 'px',
            'width:'  + s + 'px',
            'height:' + s + 'px',
            'background:radial-gradient(circle, rgba(8,16,30,0.88) 60%, rgba(3,7,15,0.72) 100%)',
            'border:2px solid rgba(120,160,220,0.7)',
            'border-radius:50%',
            'display:none',
            'align-items:center',
            'justify-content:center',
            'font-size:' + Math.floor(s * 0.46) + 'px',
            'z-index:99990',
            'cursor:pointer',
            'user-select:none',
            '-webkit-user-select:none',
            'touch-action:manipulation',
            'box-shadow:0 3px 12px rgba(0,0,0,0.5)',
            'transition:transform 0.1s'
        ].join(';');
        _btnAtras.textContent = '\u2190'; // ←
        _btnAtras.addEventListener('click', _pulsarAtras);
        _btnAtras.addEventListener('touchend', function(e) {
            e.preventDefault();
            _pulsarAtras();
        });
        document.body.appendChild(_btnAtras);
    }

    function _pulsarAtras() {
        if (SceneManager.isSceneChanging()) return;
        SoundManager.playCancel();
        Input._currentState['escape'] = true;
        setTimeout(function() { Input._currentState['escape'] = false; }, 120);
    }

    function _actualizarVisibilidadAtras() {
        if (!_btnAtras) return;
        var mostrar = isMobile() && _esEscenaConAtras();
        _btnAtras.style.display = mostrar ? 'flex' : 'none';
    }

    // =========================================================================
    // BOTÓN X — cancelar (solo en batalla)
    // =========================================================================

    function _dibujarBotonX(bmp, size) {
        var r   = size / 2;
        var ctx = bmp._context;

        ctx.beginPath();
        ctx.arc(r, r, r - 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();

        var grad = ctx.createRadialGradient(r - size*0.15, r - size*0.15, size*0.05, r, r, r - 4);
        grad.addColorStop(0, '#d94040');
        grad.addColorStop(0.5, '#a81a1a');
        grad.addColorStop(1, '#720d0d');
        ctx.beginPath();
        ctx.arc(r, r, r - 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        var shineGrad = ctx.createRadialGradient(r, r * 0.4, 0, r, r * 0.4, r * 0.6);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.30)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(r, r, r - 4, 0, Math.PI * 2);
        ctx.fillStyle = shineGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r, r, r - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,120,120,0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        bmp.fontSize     = Math.floor(size * 0.44);
        bmp.textColor    = '#ffffff';
        bmp.outlineColor = 'rgba(80,0,0,0.8)';
        bmp.outlineWidth = 4;
        bmp.drawText('X', 0, -Math.floor(size * 0.02), size, size, 'center');
    }

    var _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
    Scene_Battle.prototype.createDisplayObjects = function() {
        _Scene_Battle_createDisplayObjects.call(this);
        this._crearBotonX();
    };

    Scene_Battle.prototype._crearBotonX = function() {
        if (!isMobile()) return;
        var s   = CFG.btnXSize;
        var bmp = new Bitmap(s, s);
        _dibujarBotonX(bmp, s);

        this._botonX        = new Sprite_Button();
        this._botonX.bitmap = bmp;
        this._botonX.x      = Graphics.width  - s - CFG.btnXRight;
        this._botonX.y      = Graphics.height - s - CFG.btnXBottom;

        this._botonX.setClickHandler(function() {
            SoundManager.playCancel();
            Input._currentState['cancel'] = true;
            setTimeout(function() { Input._currentState['cancel'] = false; }, 100);
        });

        this.addChild(this._botonX);
    };

})();