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
// 🔥 FIX GLOBAL
window.fitCanvas = function() {
    applyFit();
};
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
    // 3. Scaling — se parchea Graphics._updateCanvas
    //
    //    RPG Maker MV llama _updateCanvas cada vez que reposiciona
    //    el canvas. Si solo aplicamos CSS desde fuera, el engine lo
    //    sobreescribe en el siguiente frame. Hay que interceptarlo.
    // ================================

    function calcFit() {
        var ww = Math.max(window.innerWidth,  screen.width  || 0);
        var wh = Math.max(window.innerHeight, screen.height || 0);
        if (wh > ww) { var t = ww; ww = wh; wh = t; }
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

    c.style.position = 'absolute';
    c.style.margin   = '0';

    // 🔥 OCUPAR TODA LA PANTALLA
    c.style.width  = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';

    c.style.left = '0px';
    c.style.top  = '0px';
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