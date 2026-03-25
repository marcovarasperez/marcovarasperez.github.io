//=============================================================================
// BotonAccion.js - Botón A Circular, Abajo a la Derecha
//=============================================================================

(function() {

var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.call(this);
    this.createActionButton();
};

Scene_Map.prototype.createActionButton = function() {

    this._actionButton = new Sprite_Button();

    // Configuración de tamaño y posición
    var size = 120;           // Diámetro del botón
    var radius = size / 2;    // Radio (60)
    var margin = 20;          // Margen desde el borde de la pantalla

    var bmp = new Bitmap(size, size);

    // --- DIBUJAR EL CÍRCULO ---
    // 1. Dibujar un borde sutil (opcional, para que resalte)
    bmp.drawCircle(radius, radius, radius, 'rgba(0, 0, 0, 0.3)'); // Sombra negra suave
    
    // 2. Dibujar el círculo principal relleno
    // (Usamos radius-2 para que el borde no se corte si el bitmap es justo)
    bmp.drawCircle(radius, radius, radius - 2, "green");

    // --- DIBUJAR EL TEXTO ---
    bmp.fontSize = 50; // Un poco más grande para el círculo
    bmp.textColor = "white"; // Asegurar que sea blanco
    bmp.outlineColor = 'rgba(0, 0, 0, 0.5)'; // Borde al texto
    bmp.outlineWidth = 4;
    
    // Centrar el texto "A" verticalmente en el Bitmap
    // drawText(text, x, y, maxWidth, lineHeight, align)
    // Usamos el alto completo del bitmap como lineHeight para centrar.
    bmp.drawText("A", 0, 0, size, size, "center");

    this._actionButton.bitmap = bmp;

    // POSICIÓN: Abajo a la derecha dinámico
    this._actionButton.x = Graphics.width - size - margin;
    this._actionButton.y = Graphics.height - size - margin;

    // Lógica del Click
    this._actionButton.setClickHandler(function() {
        //console.log("BOTÓN A PULSADO");
        
        // Simular pulsación del botón 'OK' (Z, Enter o Espacio)
        Input._currentState['ok'] = true;
        
        // Liberar la tecla después de un breve momento (100ms) 
        // para que no se repita el comando infinitamente.
        setTimeout(() => { Input._currentState['ok'] = false; }, 100);
    });

    this.addChild(this._actionButton);
};

})();