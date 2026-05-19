//=============================================================================
// TouchCoordFix.js
// Corrige el desfase táctil a la derecha en móvil/APK.
//
// CAUSA: pageToCanvasX/Y dividen por _realScale, que se calcula con
// window.innerWidth/Height. En muchos Android, ese valor es menor
// que el ancho CSS real del canvas (excluye barras del sistema,
// safe-area insets, etc.), haciendo que la X computada sea más grande
// de lo real → el juego detecta los toques más a la derecha.
//
// SOLUCIÓN: usar getBoundingClientRect().width/height directamente,
// que siempre refleja el tamaño CSS real renderizado.
//
// Pon este plugin EL ÚLTIMO de la lista en el Plugin Manager.
//=============================================================================
/*:
 * @plugindesc Corrige el desfase táctil horizontal (toques detectados
 *             más a la derecha de donde se pulsa).
 *             Ponlo EL ÚLTIMO en la lista de plugins.
 * @author TouchCoordFix
 *
 * @help
 * No requiere configuración. Solo activarlo y ponerlo al final.
 *
 * Diagnóstico que resuelve:
 *   - El juego detecta los toques X píxeles más a la derecha.
 *   - Los botones se activan tocando a su izquierda.
 *   - El desfase es mayor cuanto más a la derecha de la pantalla.
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Sobrescribir pageToCanvasX usando rect.width real en lugar de _realScale
    // -------------------------------------------------------------------------
    Graphics.pageToCanvasX = function (x) {
        if (this._canvas) {
            var rect = this._canvas.getBoundingClientRect();
            if (rect.width === 0) return 0;
            return Math.round((x - rect.left) * (this._width / rect.width));
        }
        return 0;
    };

    Graphics.pageToCanvasY = function (y) {
        if (this._canvas) {
            var rect = this._canvas.getBoundingClientRect();
            if (rect.height === 0) return 0;
            return Math.round((y - rect.top) * (this._height / rect.height));
        }
        return 0;
    };

    // -------------------------------------------------------------------------
    // Resetear márgenes del body para evitar offset del canvas
    // -------------------------------------------------------------------------
    (function () {
        var style = document.createElement('style');
        style.textContent =
            'html, body {' +
            '  margin: 0 !important;' +
            '  padding: 0 !important;' +
            '  width: 100%;' +
            '  height: 100%;' +
            '  overflow: hidden;' +
            '}';
        document.head.appendChild(style);
    })();

    console.log('[TouchCoordFix] pageToCanvasX/Y corregidos (usa rect.width/height).');

})();
