//=============================================================================
// FullscreenPro.js
//=============================================================================
/*:
 * @plugindesc Fullscreen + splash + canvas scaling (PC, Web, APK)
 * @author Corregido v4
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

window.fitCanvas = function() { applyFit(); };

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
    // 3. Scaling — estira el canvas y ACTUALIZA _realScale
    //
    // _realScale es lo que usa Graphics.pageToCanvasX/Y para convertir
    // coordenadas de ratón al espacio interno del canvas.
    // Si no lo actualizamos, los clics quedan desplazados.
    // ================================

    function applyFit() {
        var c = Graphics._canvas;
        if (!c) return;

        var ww = window.innerWidth;
        var wh = window.innerHeight;

        // Escala manteniendo proporción (letterbox si es necesario)
        var scaleX = ww / screenW;
        var scaleY = wh / screenH;
        var scale  = Math.min(scaleX, scaleY);

        var displayW = Math.floor(screenW * scale);
        var displayH = Math.floor(screenH * scale);
        var left     = Math.floor((ww - displayW) / 2);
        var top      = Math.floor((wh - displayH) / 2);

        c.style.position = 'absolute';
        c.style.margin   = '0';
        c.style.width    = displayW + 'px';
        c.style.height   = displayH + 'px';
        c.style.left     = left + 'px';
        c.style.top      = top  + 'px';

        // ✅ CLAVE: actualizar _realScale para que pageToCanvasX/Y funcione bien
        Graphics._realScale = scale;
    }

    var _orig_updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        if (_orig_updateCanvas) _orig_updateCanvas.call(this);
        applyFit();
    };

    var _orig_updateRenderer = Graphics._updateRenderer;
    Graphics._updateRenderer = function() {
        if (_orig_updateRenderer) _orig_updateRenderer.call(this);
        applyFit();
    };

    window.addEventListener('resize', applyFit);
    window.addEventListener('orientationchange', function() {
        setTimeout(applyFit, 250);
    });

    // ================================
    // 4. Fullscreen (NW.js y Mobile/Web)
    // ================================
    var _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function() {
        _SceneManager_initialize.call(this);

        if (Utils.isNwjs()) {
            try {
                var gui = require('nw.gui');
                var win = gui.Window.get();
                win.enterFullscreen();
            } catch(e) {}
            return;
        }

        function requestFS() {
            var el = document.documentElement;
            var fn = el.requestFullscreen
                  || el.webkitRequestFullscreen
                  || el.mozRequestFullScreen
                  || el.msRequestFullscreen;
            if (fn) {
                fn.call(el).then(applyFit).catch(function() {});
            }
        }

        requestFS();
        document.addEventListener('touchstart', requestFS, { once: true });
        document.addEventListener('mousedown',  requestFS, { once: true });
    };

    // ================================
    // 5. Escena de Splash propia
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

            this._bg = new Sprite(new Bitmap(screenW, screenH));
            this._bg.bitmap.fillAll('#000000');
            this.addChild(this._bg);

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
                this._sprite.opacity = Math.floor((this._timer / fadeLen) * 255);
            } else if (this._timer <= splashFrames - fadeLen) {
                this._sprite.opacity = 255;
            } else if (this._timer <= splashFrames) {
                var remaining = splashFrames - this._timer;
                this._sprite.opacity = Math.floor((remaining / fadeLen) * 255);
            } else {
                SceneManager.goto(Scene_Title);
            }
        };

        Scene_Boot.prototype.startNormalGame = function() {
            SceneManager.goto(Scene_Splash);
        };
    }

    // ================================
    // 6. Scene_Boot — aplicar scaling al arrancar
    // ================================
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        applyFit();
    };

    // ================================
    // 7. Game Over centrado
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
    // 8. Eliminar logo de RPG Maker
    // ================================
    Graphics._paintUpperCanvas = function() {
        this._clearUpperCanvas();
    };

})();