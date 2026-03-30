//=============================================================================
// FullscreenPro.js
//=============================================================================
/*:
 * @plugindesc Fullscreen + splash + canvas scaling (PC, Web, APK)
 * @author Corregido v3
 *
 * @param Screen Width
 * @default 1280
 *
 * @param Screen Height
 * @default 720
 *
 * @param Splash Image
 * @desc Imagen en img/system (sin extensión). Deja vacío para no mostrar splash.
 * @default Splash
 *
 * @param Splash Duration
 * @desc Duración del splash en frames (60 = 1 segundo)
 * @default 180
 *
 * @param Game Over Image
 * @desc Imagen en img/system (sin extensión)
 * @default GameOver
 */

(function() {

    var parameters   = PluginManager.parameters('FullscreenPro');
    var screenW      = Number(parameters['Screen Width']    || 1280);
    var screenH      = Number(parameters['Screen Height']   || 720);
    var splashImage  = String(parameters['Splash Image']    || 'Splash');
    var splashFrames = Number(parameters['Splash Duration'] || 180);
    var gameOverImg  = String(parameters['Game Over Image'] || 'GameOver');

    // ================================
    // 1. Resolución — una sola vez
    // ================================
    var _SceneManager_initGraphics = SceneManager.initGraphics;
    SceneManager.initGraphics = function() {
        _SceneManager_initGraphics.call(this);
        Graphics.width     = screenW;
        Graphics.height    = screenH;
        Graphics.boxWidth  = screenW;
        Graphics.boxHeight = screenH;
    };

    // ================================
    // 2. CSS base — body/html sin márgenes
    // ================================
    (function injectBaseCSS() {
        var style = document.createElement('style');
        style.textContent =
            'html,body{margin:0!important;padding:0!important;' +
            'width:100%!important;height:100%!important;' +
            'overflow:hidden!important;background:#000!important;}';
        document.head.appendChild(style);
    })();

    // ================================
    // 3. Scaling real — parcheamos Graphics._updateCanvas
    //    RPG Maker MV llama esta función cada vez que necesita
    //    reposicionar el canvas. Si solo ponemos CSS desde fuera,
    //    el engine lo sobreescribe continuamente. Hay que interceptarlo.
    // ================================

    function calcFit() {
        // En móvil landscape, window.innerWidth puede ser menor que
        // la pantalla real porque el navegador reserva espacio para su UI.
        // screen.width/height siempre devuelven el tamaño físico del dispositivo.
        var ww = Math.max(window.innerWidth,  screen.width  || 0);
        var wh = Math.max(window.innerHeight, screen.height || 0);
        // Si por algún motivo obtenemos portrait, giramos los ejes
        if (wh > ww) { var t = ww; ww = wh; wh = t; }
        var scale   = Math.min(ww / screenW, wh / screenH);
        var scaledW = Math.floor(screenW * scale);
        var scaledH = Math.floor(screenH * scale);
        return {
            scaledW: scaledW,
            scaledH: scaledH,
            left:    Math.floor((ww - scaledW) / 2),
            top:     Math.floor((wh - scaledH) / 2)
        };
    }

    function applyFit() {
        var c = Graphics._canvas;
        if (!c) return;
        var f = calcFit();
        c.style.position = 'absolute';
        c.style.margin   = '0';
        c.style.width    = f.scaledW + 'px';
        c.style.height   = f.scaledH + 'px';
        c.style.left     = f.left    + 'px';
        c.style.top      = f.top     + 'px';
    }

    // _updateCanvas es el método interno de MV que posiciona el canvas.
    // Lo envolvemos para aplicar nuestro scaling justo después.
    var _orig_updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        if (_orig_updateCanvas) _orig_updateCanvas.call(this);
        applyFit();
    };

    // _updateRenderer también puede tocar el canvas vía PIXI
    var _orig_updateRenderer = Graphics._updateRenderer;
    Graphics._updateRenderer = function() {
        if (_orig_updateRenderer) _orig_updateRenderer.call(this);
        applyFit();
    };

    // Reajuste al girar/redimensionar
    window.addEventListener('resize', applyFit);
    window.addEventListener('orientationchange', function() {
        setTimeout(applyFit, 250);
    });

    // ================================
    // 3. Fullscreen (NW.js y Mobile/Web)
    // ================================
    var _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function() {
        _SceneManager_initialize.call(this);

        // --- PC con NW.js ---
        if (Utils.isNwjs()) {
            try {
                var gui = require('nw.gui');
                var win = gui.Window.get();
                win.enterFullscreen();
            } catch(e) {}
            return; // En NW.js no necesitamos requestFullscreen
        }

        // --- Web / APK (WebView) ---
        // Algunos WebViews permiten fullscreen automático; en otros hace falta
        // un gesto del usuario (toque/click). Cubrimos ambos casos.

        function requestFS() {
            var el = document.documentElement;
            var fn = el.requestFullscreen
                  || el.webkitRequestFullscreen
                  || el.mozRequestFullScreen
                  || el.msRequestFullscreen;
            if (fn) {
                fn.call(el).then(fitCanvas).catch(function() {
                    // Fallo silencioso — se usará solo el scaling CSS
                });
            }
        }

        // Intento inmediato (funciona en algunos WebViews Android)
        requestFS();

        // Fallback: primer toque o click del usuario
        function onFirstGesture() {
            requestFS();
            document.removeEventListener('touchstart', onFirstGesture);
            document.removeEventListener('mousedown',  onFirstGesture);
        }
        document.addEventListener('touchstart', onFirstGesture, { once: true });
        document.addEventListener('mousedown',  onFirstGesture, { once: true });
    };

    // ================================
    // 4. Escena de Splash propia
    //    Se inserta ANTES de Scene_Title
    // ================================
    if (splashImage) {

        function Scene_Splash() {
            this.initialize.apply(this, arguments);
        }

        Scene_Splash.prototype = Object.create(Scene_Base.prototype);
        Scene_Splash.prototype.constructor = Scene_Splash;

        Scene_Splash.prototype.initialize = function() {
            Scene_Base.prototype.initialize.call(this);
            this._timer = 0;
        };

        Scene_Splash.prototype.create = function() {
            Scene_Base.prototype.create.call(this);

            // Fondo negro
            this._bg = new Sprite(new Bitmap(screenW, screenH));
            this._bg.bitmap.fillAll('#000000');
            this.addChild(this._bg);

            // Imagen del splash (centrada)
            this._sprite = new Sprite();
            this._sprite.opacity = 0;
            this.addChild(this._sprite);

            var self = this;
            var bitmap = ImageManager.loadSystem(splashImage);
            bitmap.addLoadListener(function() {
                self._sprite.bitmap = bitmap;
                self._sprite.x = Math.floor((screenW - bitmap.width)  / 2);
                self._sprite.y = Math.floor((screenH - bitmap.height) / 2);
            });
        };

        Scene_Splash.prototype.update = function() {
            Scene_Base.prototype.update.call(this);
            this._timer++;

            var fadeLen = 40;
            if (this._timer <= fadeLen) {
                // Fade in
                this._sprite.opacity = Math.floor((this._timer / fadeLen) * 255);
            } else if (this._timer <= splashFrames - fadeLen) {
                // Visible
                this._sprite.opacity = 255;
            } else if (this._timer <= splashFrames) {
                // Fade out
                var remaining = splashFrames - this._timer;
                this._sprite.opacity = Math.floor((remaining / fadeLen) * 255);
            } else {
                // Ir al título
                SceneManager.goto(Scene_Title);
            }
        };

        // Redirigir el boot al splash en lugar de ir directo al título
        Scene_Boot.prototype.startNormalGame = function() {
            SceneManager.goto(Scene_Splash);
        };
    }

    // ================================
    // 5. Scene_Boot — aplicar scaling al arrancar
    // ================================
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        applyFit();
    };

    // ================================
    // 6. Game Over centrado
    // ================================
    Scene_Gameover.prototype.createBackground = function() {
        var bitmap = ImageManager.loadSystem(gameOverImg);
        this._backgroundSprite = new Sprite(bitmap);
        this.addChild(this._backgroundSprite);

        var self = this;
        bitmap.addLoadListener(function() {
            self._backgroundSprite.x = Math.floor((screenW - bitmap.width)  / 2);
            self._backgroundSprite.y = Math.floor((screenH - bitmap.height) / 2);
        });
    };

    // ================================
    // 7. Eliminar logo de RPG Maker
    // ================================
    Graphics._paintUpperCanvas = function() {
        this._clearUpperCanvas();
    };

})();