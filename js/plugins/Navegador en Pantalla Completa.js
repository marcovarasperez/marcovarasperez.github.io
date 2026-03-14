/*:
 * @plugindesc Escala el canvas para llenar toda la ventana del navegador
 * @author Fix
 */
(function() {

    function fitCanvas() {
        var scaleX = window.innerWidth  / Graphics.width;
        var scaleY = window.innerHeight / Graphics.height;
        var scale  = Math.min(scaleX, scaleY); // mantiene proporción

        var canvas = Graphics._canvas;
        var div    = Graphics._errorPrinter || canvas.parentElement;

        canvas.style.width  = (Graphics.width  * scale) + 'px';
        canvas.style.height = (Graphics.height * scale) + 'px';
        canvas.style.position = 'absolute';
        canvas.style.left = ((window.innerWidth  - Graphics.width  * scale) / 2) + 'px';
        canvas.style.top  = ((window.innerHeight - Graphics.height * scale) / 2) + 'px';
    }

    // Ajustar al cargar y al cambiar tamaño de ventana
    window.addEventListener('load',   fitCanvas);
    window.addEventListener('resize', fitCanvas);

    // También al iniciar la escena
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        fitCanvas();
    };

})();