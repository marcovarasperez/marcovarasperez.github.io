//=============================================================================
// MOG_TouchFix.js
//=============================================================================
/*:
 * @plugindesc Escala los parametros de posicion de los plugins MOG al tamaño
 *             real de pantalla (1280x720) desde su base de diseño (816x624).
 * @author Fix para FullscreenPro + MOG
 *
 * @param Base Width
 * @desc Ancho base para el que fueron disenados los menus MOG
 * @default 816
 *
 * @param Base Height
 * @desc Alto base para el que fueron disenados los menus MOG
 * @default 624
 *
 * @help
 * Pon este plugin el ULTIMO de todos en el Plugin Manager.
 * Desactiva "Navegador en Pantalla Completa.js" y MOG_FullscreenFix.js
 */

(function() {

    var parameters = PluginManager.parameters('MOG_TouchFix');
    var BASE_W = Number(parameters['Base Width']  || 816);
    var BASE_H = Number(parameters['Base Height'] || 624);

    function sx() { return Graphics.boxWidth  / BASE_W; }
    function sy() { return Graphics.boxHeight / BASE_H; }

    function scaleParam(name, value) {
        var n = name.toUpperCase();
        if (n.indexOf('FONTSIZE')   >= 0) return value;
        if (n.indexOf('ROTATION')   >= 0) return value;
        if (n.indexOf('MAXVISIBLE') >= 0) return value;
        if (n.indexOf('VISIBLE')    >= 0) return value;
        if (n.indexOf('COLOR')      >= 0) return value;
        if (/_S$/.test(name))             return value;
        var last = n.charAt(n.length - 1);
        if (last === 'X' || n.indexOf('WIDTH')  >= 0) return Math.round(value * sx());
        if (last === 'Y' || n.indexOf('HEIGHT') >= 0) return Math.round(value * sy());
        return value;
    }

    var PREFIXES = ['scMenu_','scSkill_','scItem_','scEquip_','scStatus_','scFile_'];

    function scaleAllMoghunterParams() {
        if (typeof Moghunter === 'undefined') return;
        PREFIXES.forEach(function(prefix) {
            Object.keys(Moghunter).forEach(function(key) {
                if (key.indexOf(prefix) === 0 && typeof Moghunter[key] === 'number') {
                    Moghunter[key] = scaleParam(key, Moghunter[key]);
                }
            });
        });
        console.log('[MOG_TouchFix] Todos los parametros MOG escalados. sx=' +
                    sx().toFixed(3) + ' sy=' + sy().toFixed(3));
        console.log('[MOG_TouchFix] scSkill_HelpWindowY ahora=' + Moghunter.scSkill_HelpWindowY);
    }

    // =========================================================================
    // Escalar en Scene_Boot.start — ocurre UNA SOLA VEZ al arrancar,
    // DESPUES de que FullscreenPro haya puesto boxWidth=1280,
    // pero ANTES de que cualquier escena MOG cree sus ventanas.
    // =========================================================================
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        scaleAllMoghunterParams();
    };

    // =========================================================================
    // Escalar el _field decorativo en cada escena MOG
    // =========================================================================
    var mogScenes = [Scene_Menu, Scene_Item, Scene_Skill, Scene_Equip, Scene_Status, Scene_File];
    mogScenes.forEach(function(SceneClass) {
        var origStart = SceneClass.prototype.start;
        SceneClass.prototype.start = function() {
            if (origStart) origStart.call(this);
            if (this._field) {
                this._field.scale.x = sx();
                this._field.scale.y = sy();
            }
        };
    });

    // =========================================================================
    // Corregir isOnSprite de MOG_SceneMenu
    // =========================================================================
    if (Scene_Menu.prototype.isOnSprite) {
        Scene_Menu.prototype.isOnSprite = function(sprite) {
            if (!sprite || sprite.visible === false || sprite.opacity === 0) return false;
            var fsx = (this._field && this._field.scale.x) ? this._field.scale.x : 1;
            var fsy = (this._field && this._field.scale.y) ? this._field.scale.y : 1;
            var tx  = TouchInput.x / fsx;
            var ty  = TouchInput.y / fsy;
            var cw  = sprite.bitmap ? (sprite.bitmap.width  / 2) : 32;
            var ch  = sprite.bitmap ? (sprite.bitmap.height / 2) : 32;
            return (tx >= sprite.x - cw && tx <= sprite.x + cw &&
                    ty >= sprite.y - ch && ty <= sprite.y + ch);
        };
    }

    console.log('[MOG_TouchFix] Plugin registrado. Escalado pendiente hasta Scene_Boot.start.');

})();