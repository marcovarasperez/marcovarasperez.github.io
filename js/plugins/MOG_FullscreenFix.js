//=============================================================================
// MOG_FullscreenFix.js
//=============================================================================
/*:
 * @plugindesc Escala los menús MOG a la resolución real de pantalla
 * @author Fix
 *
 * @param Base Width
 * @desc Ancho base para el que fueron diseñados los plugins MOG
 * @default 816
 *
 * @param Base Height
 * @desc Alto base para el que fueron diseñados los plugins MOG
 * @default 624
 *
 * @help
 * Pon este plugin DESPUÉS de todos los plugins MOG_Scene en la lista.
 * Escala automáticamente todas las ventanas y sprites de los menús MOG
 * para que ocupen toda la pantalla en cualquier resolución.
 */

(function() {

    var parameters = PluginManager.parameters('MOG_FullscreenFix');
    var baseW = Number(parameters['Base Width']  || 816);
    var baseH = Number(parameters['Base Height'] || 624);

    // Escala proporcional respecto a la resolución real
    function scaleX() { return Graphics.boxWidth  / baseW; }
    function scaleY() { return Graphics.boxHeight / baseH; }

    //=========================================================================
    // Escalar el campo principal (_field) de cada escena MOG
    // Todos los sprites de los menús MOG se añaden a this._field
    // Escalando ese contenedor todo lo que contiene se escala junto
    //=========================================================================

    // ── Scene_Menu ───────────────────────────────────────────────────────────
    var _scMenu_createField = Scene_Menu.prototype.createField;
    Scene_Menu.prototype.createField = function() {
        _scMenu_createField.call(this);
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
    };

    // ── Scene_Item ───────────────────────────────────────────────────────────
    var _scItem_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _scItem_create.call(this);
        this._scaleField();
    };

    Scene_Item.prototype._scaleField = function() {
        // MOG SceneItem crea un _field o añade sprites directamente
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
        // Escalar ventanas de items
        this._scaleWindow(this._itemWindow);
        this._scaleWindow(this._helpWindow);
        this._scaleWindow(this._categoryWindow);
    };

    // ── Scene_Skill ──────────────────────────────────────────────────────────
    var _scSkill_create = Scene_Skill.prototype.create;
    Scene_Skill.prototype.create = function() {
        _scSkill_create.call(this);
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
        this._scaleWindow(this._itemWindow);
        this._scaleWindow(this._helpWindow);
        this._scaleWindow(this._skillTypeWindow);
        this._scaleWindow(this._statusWindow);
    };

    // ── Scene_Equip ──────────────────────────────────────────────────────────
    var _scEquip_create = Scene_Equip.prototype.create;
    Scene_Equip.prototype.create = function() {
        _scEquip_create.call(this);
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
        this._scaleWindow(this._itemWindow);
        this._scaleWindow(this._helpWindow);
        this._scaleWindow(this._slotWindow);
        this._scaleWindow(this._statusWindow);
        this._scaleWindow(this._commandWindow);
    };

    // ── Scene_Status ─────────────────────────────────────────────────────────
    var _scStatus_create = Scene_Status.prototype.create;
    Scene_Status.prototype.create = function() {
        _scStatus_create.call(this);
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
        this._scaleWindow(this._statusWindow);
    };

    // ── Scene_File (guardado/carga) ───────────────────────────────────────────
    var _scFile_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function() {
        _scFile_create.call(this);
        if (this._field) {
            this._field.scale.x = scaleX();
            this._field.scale.y = scaleY();
        }
        this._scaleWindow(this._listWindow);
        this._scaleWindow(this._helpWindow);
    };

    //=========================================================================
    // Función genérica para escalar una ventana
    // Reposiciona y redimensiona según la escala
    //=========================================================================
    Scene_MenuBase.prototype._scaleWindow = function(win) {
        if (!win) return;
        win.x      = Math.round(win.x      * scaleX());
        win.y      = Math.round(win.y      * scaleY());
        win.width  = Math.round(win.width  * scaleX());
        win.height = Math.round(win.height * scaleY());
        if (win.refresh) win.refresh();
    };

    //=========================================================================
    // Escalar ventanas de comandos del menú principal
    //=========================================================================
    var _scMenu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _scMenu_createCommandWindow.call(this);
        if (this._commandWindow) {
            this._commandWindow.x      = Math.round(this._commandWindow.x      * scaleX());
            this._commandWindow.y      = Math.round(this._commandWindow.y      * scaleY());
            this._commandWindow.width  = Math.round(this._commandWindow.width  * scaleX());
            this._commandWindow.height = Math.round(this._commandWindow.height * scaleY());
        }
    };

    //=========================================================================
    // Hacer que las ventanas de items, skills, equip y status
    // usen el tamaño completo de pantalla
    //=========================================================================

    // Window_ItemList
    var _wItemList_initialize = Window_ItemList.prototype.initialize;
    Window_ItemList.prototype.initialize = function(x, y, width, height) {
        _wItemList_initialize.call(this, x, y, width, height);
    };

    // Forzar tamaño completo en windowWidth/windowHeight de las escenas MOG
    // Estos métodos devuelven el tamaño de la ventana en los plugins MOG

    var _patchWindowSize = function(proto) {
        if (proto.windowWidth) {
            var orig = proto.windowWidth;
            proto.windowWidth = function() {
                var val = orig.call(this);
                // Si el valor original era fijo y menor que la pantalla, escalarlo
                if (val > 0 && val < Graphics.boxWidth) {
                    return Math.round(val * scaleX());
                }
                return val;
            };
        }
        if (proto.windowHeight) {
            var orig2 = proto.windowHeight;
            proto.windowHeight = function() {
                var val = orig2.call(this);
                if (val > 0 && val < Graphics.boxHeight) {
                    return Math.round(val * scaleY());
                }
                return val;
            };
        }
    };

    // Aplicar a ventanas conocidas de los plugins MOG
    if (typeof Window_ItemListM  !== 'undefined') { _patchWindowSize(Window_ItemListM.prototype);  }
    if (typeof Window_SkillListM !== 'undefined') { _patchWindowSize(Window_SkillListM.prototype); }
    if (typeof Window_EquipItemM !== 'undefined') { _patchWindowSize(Window_EquipItemM.prototype); }
    if (typeof Window_MenuStatusM !== 'undefined'){ _patchWindowSize(Window_MenuStatusM.prototype);}

    //=========================================================================
    // Escalar el layout de fondo (MOG_MenuBackground)
    // Ya usa Graphics.boxWidth/boxHeight, no necesita ajuste extra
    //=========================================================================

    //=========================================================================
    // Ajustar posición Y de ventanas de ayuda que MOG pone abajo de la pantalla
    // Muchos valores de Y en los parámetros MOG asumen altura 624
    //=========================================================================
    var _scaleY_offset = function(y) {
        return Math.round(y * scaleY());
    };

    // Parchar createHelpWindow en escenas que lo usan con Y fijo
    var patchHelpWindow = function(SceneClass) {
        if (typeof SceneClass === 'undefined') return;
        var orig = SceneClass.prototype.createHelpWindow;
        if (!orig) return;
        SceneClass.prototype.createHelpWindow = function() {
            orig.call(this);
            if (this._helpWindow) {
                this._helpWindow.y = _scaleY_offset(this._helpWindow.y / scaleY());
            }
        };
    };

    patchHelpWindow(Scene_Item);
    patchHelpWindow(Scene_Skill);
    patchHelpWindow(Scene_Equip);

})();