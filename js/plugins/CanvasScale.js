/*:
 * @plugindesc Escala el canvas para ocupar toda la pantalla sin fullscreen.
 * Corrige la hitbox táctil en móvil. Pon este plugin ANTES de Controlesmobile.
 * @author Fix
 *
 * @param Ancho
 * @desc Resolución horizontal del juego
 * @default 816
 *
 * @param Alto
 * @desc Resolución vertical del juego
 * @default 624
 */

(function() {

    var params = PluginManager.parameters('CanvasScale');
    var gameW  = Number(params['Ancho'] || 816);
    var gameH  = Number(params['Alto']  || 624);

    // ── Aplicar resolución ────────────────────────────────────────────────────
    var _SceneManager_initGraphics = SceneManager.initGraphics;
    SceneManager.initGraphics = function() {
        _SceneManager_initGraphics.call(this);
        Graphics.width     = gameW;
        Graphics.height    = gameH;
        Graphics.boxWidth  = gameW;
        Graphics.boxHeight = gameH;
    };

    // ── Estilos base: sin márgenes, fondo negro ───────────────────────────────
    (function() {
        var style = document.createElement('style');
        style.textContent =
            'html,body{margin:0!important;padding:0!important;' +
            'width:100%!important;height:100%!important;' +
            'overflow:hidden!important;background:#000!important;}';
        document.head.appendChild(style);
    })();

    // ── Escalar canvas manteniendo proporción + actualizar _realScale ─────────
    // _realScale es CRÍTICO: Graphics.pageToCanvasX/Y lo usa para convertir
    // coordenadas táctiles al espacio interno del juego.
    // Sin actualizarlo la hitbox queda desplazada.

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

        canvas.style.position = 'absolute';
        canvas.style.margin   = '0';
        canvas.style.width    = displayW + 'px';
        canvas.style.height   = displayH + 'px';
        canvas.style.left     = left + 'px';
        canvas.style.top      = top  + 'px';

        // Actualizar _realScale para que la hitbox sea correcta
        Graphics._realScale = scale;
    }

    // Enganchar en los métodos que RPG Maker llama al actualizar el canvas
    var _orig_updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        if (_orig_updateCanvas) _orig_updateCanvas.call(this);
        fitCanvas();
    };

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        fitCanvas();
    };

    // Reajustar si el usuario rota el móvil o cambia el tamaño de la ventana
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', function() {
        setTimeout(fitCanvas, 300);
    });

})();