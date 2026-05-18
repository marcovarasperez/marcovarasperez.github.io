/*:
 * @plugindesc Escala el canvas para ocupar toda la pantalla en móvil.
 * Corrige la hitbox táctil. Pon este plugin ANTES de Controlesmobile.
 * @author Fix
 *
 * @param Ancho
 * @desc Resolución horizontal del juego (por defecto 816)
 * @default 816
 *
 * @param Alto
 * @desc Resolución vertical del juego (por defecto 624)
 * @default 624
 */

(function() {

    var params = PluginManager.parameters('CanvasScale');
    var gameW  = Number(params['Ancho'] || 816);
    var gameH  = Number(params['Alto']  || 624);

    // Escala CSS actual — se mantiene sincronizada con _realScale en todo momento
    var _currentScale = 1;

    // ── Resolución interna ────────────────────────────────────────────────────
    var _SceneManager_initGraphics = SceneManager.initGraphics;
    SceneManager.initGraphics = function() {
        _SceneManager_initGraphics.call(this);
        Graphics.width     = gameW;
        Graphics.height    = gameH;
        Graphics.boxWidth  = gameW;
        Graphics.boxHeight = gameH;
    };

    // ── CSS base: sin márgenes, fondo negro ───────────────────────────────────
    (function() {
        var style = document.createElement('style');
        style.textContent =
            'html,body{margin:0!important;padding:0!important;' +
            'width:100%!important;height:100%!important;' +
            'overflow:hidden!important;background:#000!important;}';
        document.head.appendChild(style);
    })();

    // ── fitCanvas ─────────────────────────────────────────────────────────────
    // Escala el canvas manteniendo proporción y lo centra en el viewport.
    //
    // Usamos position:fixed (relativo al viewport) en vez de position:absolute.
    // En móvil, position:absolute es relativo al documento, que puede tener
    // altura variable por la barra del navegador → top/left quedan incorrectos.
    // position:fixed siempre es relativo al área visible → getBoundingClientRect
    // devuelve coordenadas exactas y la hitbox es correcta.

    function fitCanvas() {
        var canvas = Graphics._canvas;
        if (!canvas) return;

        var scaleX = window.innerWidth  / gameW;
        var scaleY = window.innerHeight / gameH;
        var scale  = Math.min(scaleX, scaleY);

        var displayW = Math.floor(gameW * scale);
        var displayH = Math.floor(gameH * scale);
        var left     = Math.floor((window.innerWidth  - displayW) / 2);
        var top      = Math.floor((window.innerHeight - displayH) / 2);

        canvas.style.position = 'fixed';
        canvas.style.margin   = '0';
        canvas.style.left     = left + 'px';
        canvas.style.top      = top  + 'px';
        canvas.style.width    = displayW + 'px';
        canvas.style.height   = displayH + 'px';

        _currentScale       = scale;
        Graphics._realScale = scale;
    }

    // ── Bloquear _centerElement en el canvas ──────────────────────────────────
    // RPG Maker llama a _centerElement desde _updateCanvas cada frame.
    // _centerElement aplica position:absolute + margin:auto + left:0 + right:0
    // lo que sobreescribe nuestro CSS y rompe el cálculo de getBoundingClientRect.
    // Lo interceptamos para el canvas y aplicamos nuestros valores en su lugar.

    var _orig_centerElement = Graphics._centerElement;
    Graphics._centerElement = function(element) {
        if (element === this._canvas) {
            fitCanvas();
            return;
        }
        _orig_centerElement.call(this, element);
    };

    // ── Mantener _realScale correcto en cada frame ────────────────────────────
    // RPG Maker llama a _updateRealScale() desde _updateAllElements() cada frame.
    // Sin este override, lo resetea a 1 (stretchEnabled=false) o a
    // innerW/gameW (stretchEnabled=true), ambos incorrectos cuando la barra del
    // navegador móvil cambia de tamaño. Forzamos siempre _currentScale.

    Graphics._updateRealScale = function() {
        Graphics._realScale = _currentScale;
    };

    // ── Aplicar al arrancar ───────────────────────────────────────────────────
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        fitCanvas();
    };

    // ── Reajustar en resize y rotación de pantalla ────────────────────────────
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', function() {
        setTimeout(fitCanvas, 300);
    });

    // ── Bloquear zoom ─────────────────────────────────────────────────────────
    (function() {
        var meta = document.querySelector('meta[name=viewport]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    })();

    document.addEventListener('gesturestart',  function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });

})();