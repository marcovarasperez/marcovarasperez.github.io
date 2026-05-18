//=============================================================================
// BotonCancelarCombate.js
// Botón cancelar en combate (misma posición que botón A)
//=============================================================================

(function() {

var _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
Scene_Battle.prototype.createDisplayObjects = function() {
    _Scene_Battle_createDisplayObjects.call(this);
    this.createCancelButton();
};

Scene_Battle.prototype.createCancelButton = function() {

    this._cancelButton = new Sprite_Button();

    var size = 120;
    var radius = size / 2;
    var margin = 20;

    var bmp = new Bitmap(size, size);

    // círculo
    bmp.drawCircle(radius, radius, radius, 'rgba(0,0,0,0.3)');
    bmp.drawCircle(radius, radius, radius - 2, "red");

    // texto
    bmp.fontSize = 50;
    bmp.textColor = "white";
    bmp.outlineWidth = 4;
    bmp.drawText("X", 0, 0, size, size, "center");

    this._cancelButton.bitmap = bmp;

    // MISMA POSICIÓN QUE TU BOTÓN A
    this._cancelButton.x = Graphics.width - size - margin -160;
    this._cancelButton.y = Graphics.height - size - margin -160;

    this._cancelButton.setClickHandler(function() {

        SoundManager.playCancel();

        Input._currentState['cancel'] = true;

        setTimeout(function(){
            Input._currentState['cancel'] = false;
        },100);

    });

    this.addChild(this._cancelButton);
};

})();