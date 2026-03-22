//=============================================================================
// FullscreenPro.js
//=============================================================================
/*:
 * @plugindesc Fullscreen + splash correcto
 * @author Corregido v2
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
    // 2. Fullscreen desde el arranque
    //    NW.js no necesita interacción
    //    del usuario — se puede llamar
    //    directamente en initialize
    // ================================
    var _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function() {
        _SceneManager_initialize.call(this);
        // NW.js: pantalla completa directa
        if (Utils.isNwjs()) {
            var gui = require('nw.gui');
            var win = gui.Window.get();
            win.enterFullscreen();
        } else {
            // Navegador: intenta fullscreen en el primer click
            document.addEventListener('click', function handler() {
                Graphics._switchFullScreen();
                document.removeEventListener('click', handler);
            }, { once: true });
        }
    };

    // ================================
    // 3. Escena de Splash propia
    //    Se inserta ANTES de Scene_Title
    //    así no compite con nada
    // ================================
    if (splashImage) {

        function Scene_Splash() {
            this.initialize.apply(this, arguments);
        }

        Scene_Splash.prototype = Object.create(Scene_Base.prototype);
        Scene_Splash.prototype.constructor = Scene_Splash;

        Scene_Splash.prototype.initialize = function() {
            Scene_Base.prototype.initialize.call(this);
            this._timer    = 0;
            this._fadeOut  = false;
        };

        Scene_Splash.prototype.create = function() {
            Scene_Base.prototype.create.call(this);

            // Fondo negro
            this._bg = new Sprite(new Bitmap(screenW, screenH));
            this._bg.bitmap.fillAll('#000000');
            this.addChild(this._bg);

            // Imagen del splash
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

            // Fade in: primeros 40 frames
            if (this._timer <= 40) {
                this._sprite.opacity = Math.floor((this._timer / 40) * 255);

            // Espera en el centro
            } else if (this._timer <= splashFrames - 40) {
                this._sprite.opacity = 255;

            // Fade out: últimos 40 frames
            } else if (this._timer <= splashFrames) {
                var remaining = splashFrames - this._timer;
                this._sprite.opacity = Math.floor((remaining / 40) * 255);

            // Fin — ir al título
            } else {
                SceneManager.goto(Scene_Title);
            }
        };

        // Interceptar Scene_Boot para que vaya al splash
        // en lugar de ir directamente al título
        var _Scene_Boot_startNormalGame = Scene_Boot.prototype.startNormalGame;
        Scene_Boot.prototype.startNormalGame = function() {
            SceneManager.goto(Scene_Splash);
        };
    }

    // ================================
    // 4. Game Over centrado
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
 Graphics._paintUpperCanvas = function() {
    this._clearUpperCanvas();
    // No pintar nada — elimina el logo de RPG Maker
};
})();