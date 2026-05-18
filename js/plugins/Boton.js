//=============================================================================
// BotonAccion.js - Botón A Circular + Botón Mochila (Inventario)
//=============================================================================

(function() {

// ─── BOTÓN A (Acción / OK) ────────────────────────────────────────────────────
var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.call(this);
    this.createActionButton();
    this.createMochilaButton();
};

Scene_Map.prototype.createActionButton = function() {
    this._actionButton = new Sprite_Button();

    var size   = 120;
    var radius = size / 2;
    var margin = 20;

    var bmp = new Bitmap(size, size);
    bmp.drawCircle(radius, radius, radius,     'rgba(0,0,0,0.3)');
    bmp.drawCircle(radius, radius, radius - 2, 'green');

    bmp.fontSize     = 50;
    bmp.textColor    = 'white';
    bmp.outlineColor = 'rgba(0,0,0,0.5)';
    bmp.outlineWidth = 4;
    bmp.drawText('A', 0, 0, size, size, 'center');

    this._actionButton.bitmap = bmp;
    this._actionButton.x = Graphics.width  - size - margin - 160;
    this._actionButton.y = Graphics.height - size - margin - 160;

    this._actionButton.setClickHandler(function() {
        Input._currentState['ok'] = true;
        setTimeout(function() { Input._currentState['ok'] = false; }, 100);
    });

    this.addChild(this._actionButton);
};

// ─── BOTÓN MOCHILA (Inventario) ───────────────────────────────────────────────
Scene_Map.prototype.createMochilaButton = function() {
    this._mochilaButton = new Sprite_Button();

    var size   = 90;
    var radius = size / 2;
    var margin = 20;

    var bmp = new Bitmap(size, size);

    // Fondo circular oscuro semitransparente
    bmp.drawCircle(radius, radius, radius,     'rgba(0,0,0,0.35)');
    bmp.drawCircle(radius, radius, radius - 2, 'rgba(20,14,8,0.80)');

    // Borde dorado
    var ctx = bmp._context;
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,168,76,0.75)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Icono de mochila
    bmp.fontSize     = Math.floor(size * 0.46);
    bmp.textColor    = '#f0d080';
    bmp.outlineColor = 'rgba(0,0,0,0.8)';
    bmp.outlineWidth = 4;
    bmp.drawText('\uD83C\uDF92', 0, Math.floor(size * 0.06), size, size * 0.88, 'center');

    this._mochilaButton.bitmap  = bmp;
    this._mochilaButton.opacity = 220;

    // Posición: encima del botón A, mismo eje X
    this._mochilaButton.x = Graphics.width  - size - margin - 175;
    this._mochilaButton.y = Graphics.height - size - margin - 290;

    this._mochilaButton.setClickHandler(function() {
        if (!$gameSystem.isMenuEnabled()) return;
        if ($gameMessage.isBusy())        return;
        SoundManager.playOk();
        SceneManager.push(Scene_Item);
    });

    this.addChild(this._mochilaButton);
};

// ─── Actualizar visibilidad ───────────────────────────────────────────────────
var _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    // Ocultar ambos botones durante mensajes o transiciones
    var mostrar = !$gameMessage.isBusy() && !SceneManager.isSceneChanging();
    if (this._mochilaButton) this._mochilaButton.visible = mostrar;
};

})();