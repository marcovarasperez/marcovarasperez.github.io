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

    // Guardamos la escala calculada en esta variable
    // Graphics._realScale se debe mantener igual a esto en todo momento
    var _currentScale = 1;

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

        _currentScale = scale;
        Graphics._realScale = scale;
    }

    // CLAVE: RPG Maker sobreescribe _realScale cada frame en _updateRealScale().
    // Lo sobreescribimos para que siempre use nuestra escala calculada.
    // Sin esto, _realScale vuelve a 1 en cada frame y la hitbox queda doblada.
    Graphics._updateRealScale = function() {
        Graphics._realScale = _currentScale;
    };

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

    // ── Bloquear zoom por pellizco y doble toque ──────────────────────────────
    // (ControlesMobile también lo hace, pero si no está activo esto lo cubre)
    document.addEventListener('gesturestart',  function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });

    // Meta viewport: bloquea el zoom del navegador a nivel de HTML
    (function() {
        var meta = document.querySelector('meta[name=viewport]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    })();

})();