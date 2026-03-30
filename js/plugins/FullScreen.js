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
    // 2. CSS base — elimina márgenes y fuerza tamaño real
    //    Se inyecta una sola vez, antes de cualquier cálculo
    // ================================
    (function injectBaseCSS() {
        var style = document.createElement('style');
        style.textContent = [
            'html, body {',
            '  margin: 0 !important;',
            '  padding: 0 !important;',
            '  width: 100% !important;',
            '  height: 100% !important;',
            '  overflow: hidden !important;',
            '  background: #000 !important;',
            '}',
            /* Elimina cualquier margen que RPG Maker ponga en el canvas */
            'canvas {',
            '  display: block !important;',
            '  margin: 0 !important;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    })();

    // ================================
    // 3. Canvas scaling (llena toda la pantalla manteniendo proporción)
    //    Funciona en PC, Web y APK (WebView)
    // ================================

    // Devuelve las dimensiones reales de la ventana.
    // En landscape móvil, window.innerWidth puede ser menor que screen.width
    // porque el navegador reserva espacio para su barra de UI.
    // Usamos el mayor valor disponible para evitar barras negras.
    function getRealSize() {
        // En landscape, screen.width es el eje largo y screen.height el corto
        var sw = screen.width  || window.innerWidth;
        var sh = screen.height || window.innerHeight;

        // Nos quedamos con el valor más grande entre inner y screen
        // para cubrir tanto navegador como WebView/APK
        var w = Math.max(window.innerWidth,  sw);
        var h = Math.max(window.innerHeight, sh);

        // Seguridad: si estamos en portrait (h > w), intercambiamos
        // porque el juego es landscape 1280×720
        if (h > w) { var tmp = w; w = h; h = tmp; }

        return { w: w, h: h };
    }

    function fitCanvas() {
        var canvas = Graphics._canvas;
        if (!canvas) return;

        var size   = getRealSize();
        var winW   = size.w;
        var winH   = size.h;
        var scale  = Math.min(winW / screenW, winH / screenH);

        var scaledW = Math.floor(screenW * scale);
        var scaledH = Math.floor(screenH * scale);

        canvas.style.width    = scaledW + 'px';
        canvas.style.height   = scaledH + 'px';
        canvas.style.position = 'absolute';
        canvas.style.left     = Math.floor((winW - scaledW) / 2) + 'px';
        canvas.style.top      = Math.floor((winH - scaledH) / 2) + 'px';
    }

    window.addEventListener('load',            fitCanvas);
    window.addEventListener('resize',          fitCanvas);
    // En móvil el resize no siempre dispara al girar; orientationchange sí
    window.addEventListener('orientationchange', function() {
        // Pequeño delay para que el navegador termine de recalcular dimensiones
        setTimeout(fitCanvas, 200);
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
        fitCanvas();
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
//=============================================================================
// FullscreenMobile.js
//=============================================================================
/*:
 * @plugindesc Fuerza pantalla completa en móvil
 */

(function() {

    var _SceneManager_run = SceneManager.run;
    SceneManager.run = function(sceneClass) {
        this._screenWidth  = window.innerWidth;
        this._screenHeight = window.innerHeight;
        this._boxWidth  = window.innerWidth;
        this._boxHeight = window.innerHeight;

        Graphics._stretchEnabled = true;

        _SceneManager_run.call(this, sceneClass);

        Graphics._updateRealScale();
    };

})();
})();