//=============================================================================
// RelativeTouchPad.js — Solo joystick + botón A
//=============================================================================
/*:
 * @plugindesc Joystick relativo + botón A. Sin toque de mapa ni dos dedos.
 * @author Triacontane (modificado)
 *
 * @param タッチ有効領域
 * @desc Área táctil válida en píxeles (x1,y1,x2,y2)
 * @default 0,0,816,624
 *
 * @param パッド画像ファイル
 * @desc Imagen del pad (sin extensión). En img/pictures/
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param アロー画像ファイル
 * @desc Imagen de la flecha (sin extensión). En img/pictures/
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param パッド画像不透明度
 * @desc Opacidad del pad (0-255)
 * @default 255
 */

function Game_Relative_Pad() {
    this.initialize.apply(this, arguments);
}

Game_Relative_Pad.disable         = false;
Game_Relative_Pad.mapTouchDisable = true;
Game_Relative_Pad.distanceNear    = 24;
Game_Relative_Pad.distanceFar     = 144;

(function () {
    var pluginName = 'RelativeTouchPad';

    var getParamString = function(paramNames) {
        var value = getParamOther(paramNames);
        return value == null ? '' : value;
    };

    var getParamNumber = function(paramNames, min, max) {
        var value = getParamOther(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(value, 10) || 0).clamp(min, max);
    };

    var getParamOther = function(paramNames) {
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++) {
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return null;
    };

    var getParamArrayString = function(paramNames) {
        var values = getParamString(paramNames).split(',');
        for (var i = 0; i < values.length; i++) values[i] = values[i].trim();
        return values;
    };

    var getParamArrayNumber = function(paramNames, min, max) {
        var values = getParamArrayString(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        for (var i = 0; i < values.length; i++) values[i] = (parseInt(values[i], 10) || 0).clamp(min, max);
        return values;
    };

    var getDiagonalInt = function(x, y) {
        return Math.floor(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    };

    var iterate = function(that, handler) {
        Object.keys(that).forEach(function(key, index) {
            handler.call(that, key, that[key], index);
        });
    };

    //=============================================================================
    // TouchInput — bloquear dos dedos, botón derecho y toque de mapa
    // Solo dejamos pasar el toque de un dedo para el joystick
    //=============================================================================

    // Bloquear dos dedos como cancelar/menú — eliminar el _onCancel
    var _TouchInput_onTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function(event) {
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            var x = Graphics.pageToCanvasX(touch.pageX);
            var y = Graphics.pageToCanvasY(touch.pageY);
            if (Graphics.isInsideCanvas(x, y)) {
                // Solo procesar si es UN dedo — ignorar dos o más
                if (event.touches.length === 1) {
                    this._screenPressed = true;
                    this._pressedTime = 0;
                    this._onTrigger(x, y);
                }
                // Dos o más dedos: no hacer nada en absoluto
                event.preventDefault();
            }
        }
        if (window.cordova || window.navigator.standalone) {
            event.preventDefault();
        }
    };

    // Bloquear botón derecho del ratón como cancelar
    TouchInput._onRightButtonDown = function(event) {
        // No hacer nada — el botón derecho no cancela ni abre menú
    };

    //=============================================================================
    // Input
    //=============================================================================
    Input.submitKey = function(keyName) {
        this._currentState[keyName] = true;
        this._submitState[keyName] = Graphics.frameCount;
    };

    var _Input_clear = Input.clear;
    Input.clear = function() {
        _Input_clear.apply(this, arguments);
        this._submitState = {};
    };

    var _Input_update = Input.update;
    Input.update = function() {
        this._suppressSubmit();
        _Input_update.apply(this, arguments);
        this._date = 0;
    };

    Input._suppressSubmit = function() {
        iterate(this._submitState, function(keyName, frameCount) {
            if (frameCount + 1 < Graphics.frameCount) {
                this._currentState[keyName] = false;
                delete this._submitState[keyName];
            }
        }.bind(this));
    };

    //=============================================================================
    // Game_Temp
    //=============================================================================
    var _Game_Temp_initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function() {
        _Game_Temp_initialize.apply(this, arguments);
        this._relativeTouchPad = new Game_Relative_Pad();
    };

    Game_Temp.prototype.getRelativeTouchPad = function() {
        return this._relativeTouchPad;
    };

    //=============================================================================
    // Game_Player
    //=============================================================================
    var _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        this.getMovePad().update();
        _Game_Player_update.apply(this, arguments);
    };

    var _Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        return _Game_Player_getInputDirection.apply(this, arguments) || this.getMovePad().getDir();
    };

    var _Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function(direction) {
        var movePad = this.getMovePad();
        if (movePad.isActive() && movePad.isDistanceNear()) {
            var turnDir = movePad.getDir4();
            if (turnDir !== 0) this.setDirection(turnDir);
        } else {
            if (direction % 2 === 0) {
                _Game_Player_executeMove.apply(this, arguments);
            } else if (direction !== 5) {
                this.executeDiagonalMove(direction);
            }
        }
    };

    Game_Player.prototype.executeDiagonalMove = function(d) {
        var horizon  = d / 3 <= 1 ? d + 3 : d - 3;
        var vertical = d % 3 === 0 ? d - 1 : d + 1;
        var x2 = $gameMap.roundXWithDirection(this.x, horizon);
        var y2 = $gameMap.roundYWithDirection(this.y, vertical);
        if (this.isCollidedWithCharacters(x2, this.y) || this.isCollidedWithCharacters(this.x, y2)) {
            return;
        }
        this.moveDiagonally(horizon, vertical);
        if (!this.isMovementSucceeded()) {
            this.moveStraight(horizon);
        }
        if (!this.isMovementSucceeded()) {
            this.moveStraight(vertical);
        }
    };

    var _Game_Player_updateDashing = Game_Player.prototype.updateDashing;
    Game_Player.prototype.updateDashing = function() {
        _Game_Player_updateDashing.apply(this, arguments);
        if (this.getMovePad().isActive() && !$gameMap.isDashDisabled() && !this.isInVehicle()) {
            this._dashing = this.getMovePad().isDistanceFar() || ConfigManager.alwaysDash;
        }
    };

    Game_Player.prototype.getMovePad = function() {
        return $gameTemp.getRelativeTouchPad();
    };

    //=============================================================================
    // Scene_Map — deshabilitar toque de mapa completamente
    //=============================================================================
    Scene_Map.prototype.isMapTouchOk = function() {
        return false; // Nunca mover al tocar el mapa
    };

    var paramTouchableRect = getParamArrayNumber(['タッチ有効領域', 'TouchableRect'], 0);

    //=============================================================================
    // Game_Relative_Pad
    //=============================================================================
    Game_Relative_Pad.prototype.constructor = Game_Relative_Pad;

    Game_Relative_Pad.prototype.initialize = function() {
        this.initMember();
    };

    Game_Relative_Pad.prototype.initMember = function() {
        this._x            = 0;
        this._y            = 0;
        this._radian       = 0;
        this._dir4         = 0;
        this._dir8         = 0;
        this._diagonalMove = true;
        this.resetNeutral();
    };

    Game_Relative_Pad.prototype.update = function() {
        this._x = TouchInput.x;
        this._y = TouchInput.y;
        if (!this.isActive()) this.updateNonActive();
        if (this.isActive())  this.updateActive();
    };

    Game_Relative_Pad.prototype.updateNonActive = function() {
        if (!Game_Relative_Pad.disable && $gamePlayer.canMove() &&
            TouchInput.isTriggered() && this._inTouchableRect()) {
            this.setNeutral();
        }
    };

    Game_Relative_Pad.prototype.updateActive = function() {
        if (!$gamePlayer.canMove() || !TouchInput.isPressed() || !this._inTouchableRect()) {
            this.initMember();
            // NO llamar submitOk aquí — el botón A ya gestiona el ok
        } else {
            this._radian = Math.atan2(this.getDeltaY(), this.getDeltaX()) * -1 + Math.PI;

            // Floating joystick: reposicionar el punto neutro si el dedo se aleja mucho
            var maxRadius = Game_Relative_Pad.distanceFar;
            var dist = this.getDistance();
            if (dist > maxRadius) {
                var angle = Math.atan2(this.getDeltaY(), this.getDeltaX());
                var excess = dist - maxRadius;
                this._neutralX -= Math.cos(angle) * excess;
                this._neutralY -= Math.sin(angle) * excess;
            }

            this._dir4 = this._calculateDir4();
            this._dir8 = this._calculateDir8();
        }
    };

    // submitOk eliminado del joystick — el botón A en Boton.js lo gestiona

    Game_Relative_Pad.prototype.setNeutral = function() {
        this._neutralX = this._x;
        this._neutralY = this._y;
    };

    Game_Relative_Pad.prototype.resetNeutral = function() {
        this._neutralX = null;
        this._neutralY = null;
    };

    Game_Relative_Pad.prototype.isActive = function() {
        return this._neutralX !== null && this._neutralY !== null;
    };

    Game_Relative_Pad.prototype.getRotation = function() {
        return -this._radian + Math.PI / 2;
    };

    Game_Relative_Pad.prototype.getDir = function() {
        return this._diagonalMove ? this._dir8 : this._dir4;
    };

    Game_Relative_Pad.prototype.getDir4 = function() {
        return this._dir4;
    };

    Game_Relative_Pad.prototype._calculateDir4 = function() {
        var pi4d = Math.PI / 4;
        if (this.isDistanceZero())                                   return 0;
        if (this._radian <  pi4d      || this._radian >= pi4d * 7)  return 6;
        if (this._radian >= pi4d      && this._radian <  pi4d * 3)  return 8;
        if (this._radian >= pi4d * 3  && this._radian <  pi4d * 5)  return 4;
        if (this._radian >= pi4d * 5  && this._radian <  pi4d * 7)  return 2;
    };

    Game_Relative_Pad.prototype._calculateDir8 = function() {
        var pi8d = Math.PI / 8;
        if (this.isDistanceZero())                                     return 0;
        if (this._radian <  pi8d       || this._radian >= pi8d * 15)  return 6;
        if (this._radian >= pi8d       && this._radian <  pi8d * 3)   return 9;
        if (this._radian >= pi8d * 3   && this._radian <  pi8d * 5)   return 8;
        if (this._radian >= pi8d * 5   && this._radian <  pi8d * 7)   return 7;
        if (this._radian >= pi8d * 7   && this._radian <  pi8d * 9)   return 4;
        if (this._radian >= pi8d * 9   && this._radian <  pi8d * 11)  return 1;
        if (this._radian >= pi8d * 11  && this._radian <  pi8d * 13)  return 2;
        if (this._radian >= pi8d * 13  && this._radian <  pi8d * 15)  return 3;
    };

    Game_Relative_Pad.prototype.getDeltaX = function() {
        return this._neutralX - this._x;
    };

    Game_Relative_Pad.prototype.getDeltaY = function() {
        return this._neutralY - this._y;
    };

    Game_Relative_Pad.prototype.getDistanceX = function() {
        return Math.abs(this.getDeltaX());
    };

    Game_Relative_Pad.prototype.getDistanceY = function() {
        return Math.abs(this.getDeltaY());
    };

    Game_Relative_Pad.prototype.getNeutralX = function() {
        return this._neutralX;
    };

    Game_Relative_Pad.prototype.getNeutralY = function() {
        return this._neutralY;
    };

    Game_Relative_Pad.prototype.getDistance = function() {
        return getDiagonalInt(this.getDistanceX(), this.getDistanceY());
    };

    Game_Relative_Pad.prototype.isDistanceZero = function() {
        return this.getDistance() === 0;
    };

    Game_Relative_Pad.prototype.isDistanceNear = function() {
        return this.getDistance() < Game_Relative_Pad.distanceNear;
    };

    Game_Relative_Pad.prototype.isDistanceFar = function() {
        return this.getDistance() > Game_Relative_Pad.distanceFar;
    };

    Game_Relative_Pad.prototype._inTouchableRect = function() {
        return this._x >= paramTouchableRect[0] && this._x <= paramTouchableRect[2] &&
               this._y >= paramTouchableRect[1] && this._y <= paramTouchableRect[3];
    };

    //=============================================================================
    // Spriteset_Map — crear el sprite del pad
    //=============================================================================
    var _Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
    Spriteset_Base.prototype.createUpperLayer = function() {
        _Spriteset_Base_createUpperLayer.apply(this, arguments);
        if (this instanceof Spriteset_Map) this.createRelativePad();
    };

    Spriteset_Map.prototype.createRelativePad = function() {
        this._relativePadSprite = new Sprite_Relative_Pad();
        this.addChild(this._relativePadSprite);
    };

    //=============================================================================
    // Sprite_Relative_Pad
    //=============================================================================
    function Sprite_Relative_Pad() {
        this.initialize.apply(this, arguments);
    }

    Sprite_Relative_Pad.prototype             = Object.create(Sprite.prototype);
    Sprite_Relative_Pad.prototype.constructor = Sprite_Relative_Pad;
    Sprite_Relative_Pad.padImage              = null;
    Sprite_Relative_Pad.arrorImage            = null;

    var _Sprite_Relative_Pad_initialize = Sprite_Relative_Pad.prototype.initialize;
    Sprite_Relative_Pad.prototype.initialize = function() {
        _Sprite_Relative_Pad_initialize.apply(this, arguments);
        this.anchor.x     = 0.5;
        this.anchor.y     = 0.5;
        this.opacity      = 0;
        var fileName      = getParamString(['パッド画像ファイル', 'ImageNamePad']);
        this.bitmap       = this.loadPictureOrEmpty(fileName, this.makeImagePad.bind(this));
        this._padActive   = false;
        this._arrowDiagonal = 0;
        this.createTouchArrowSprite();
        this.update();
    };

    Sprite_Relative_Pad.prototype.createTouchArrowSprite = function() {
        var fileName      = getParamString(['アロー画像ファイル', 'ImageNameArrow']);
        var sprite        = new Sprite();
        sprite.anchor.x   = 0.5;
        sprite.anchor.y   = 0.5;
        sprite.bitmap     = this.loadPictureOrEmpty(fileName, this.makeArrowPad.bind(this));
        this._arrowSprite = sprite;
        this.addChild(this._arrowSprite);
    };

    Sprite_Relative_Pad.prototype.loadPictureOrEmpty = function(fileName, makeImageHandler) {
        return fileName ? ImageManager.loadPicture(fileName) : makeImageHandler();
    };

    Sprite_Relative_Pad.prototype.makeImagePad = function() {
        if (!Sprite_Relative_Pad.padImage) {
            var bitmap = new Bitmap(96, 96), size = bitmap.width / 2;
            bitmap.drawCircle(size, size, size, 'rgba(255,255,255,0.5)');
            Sprite_Relative_Pad.padImage = bitmap;
        }
        return Sprite_Relative_Pad.padImage;
    };

    Sprite_Relative_Pad.prototype.makeArrowPad = function() {
        if (!Sprite_Relative_Pad.arrorImage) {
            var bitmap = new Bitmap(96, 96), width = 24, size = bitmap.width / 2;
            bitmap.drawCircle(size, width / 2, width / 2, 'rgba(128,128,128,1.0)');
            Sprite_Relative_Pad.arrorImage = bitmap;
        }
        return Sprite_Relative_Pad.arrorImage;
    };

    Sprite_Relative_Pad.prototype.refresh = function() {
        this._arrowDiagonal = getDiagonalInt(this._arrowSprite.width / 4, this._arrowSprite.height / 4);
        this.opacity  = getParamNumber(['パッド画像不透明度', 'PadOpacity'], 0, 255);
        this.scale.x  = 1.0;
        this.scale.y  = 1.0;
        this.visible  = true;
        this._padActive = true;
    };

    Sprite_Relative_Pad.prototype.update = function() {
        if (!this.getMovePad().isActive()) {
            if (this.opacity > 0) {
                this.updateFadeout();
                this._padActive = false;
            } else {
                this.visible = false;
            }
        } else {
            if (!this._padActive) this.refresh();
            this.updatePlacement();
            this.updateArrowSprite();
        }
    };

    Sprite_Relative_Pad.prototype.updatePlacement = function() {
        this.x = this.getMovePad().getNeutralX();
        this.y = this.getMovePad().getNeutralY();
    };

    Sprite_Relative_Pad.prototype.updateArrowSprite = function() {
        if (this.getMovePad().isDistanceZero()) {
            this._arrowSprite.visible = false;
        } else {
            this._arrowSprite.visible  = true;
            this._arrowSprite.rotation = this.getMovePad().getRotation();
            var scale = this.getMovePad().getDistance() / this._arrowDiagonal;
            this._arrowSprite.scale.x  = scale;
            this._arrowSprite.scale.y  = scale;
            this._arrowSprite.opacity  = Math.min(255, 255 / (scale / 1.5));
        }
    };

    Sprite_Relative_Pad.prototype.updateFadeout = function() {
        this.opacity  -= 36;
        this.scale.x  += 0.02;
        this.scale.y  += 0.02;
    };

    Sprite_Relative_Pad.prototype.getMovePad = function() {
        return $gameTemp.getRelativeTouchPad();
    };
    //=============================================================================
    // Interfaz de Botones Mejorada (Mochila, Cancelar y Botón A) - COMPATIBLE MV
    //=============================================================================
    (function() {
        
        var _actionCooldown = 0;

        // Actualizador de Cooldown global
        var _Scene_Map_update = Scene_Map.prototype.update;
        Scene_Map.prototype.update = function() {
            _Scene_Map_update.call(this);
            if (_actionCooldown > 0) _actionCooldown--;
        };

       function createAnimatedButton(iconIndex, x, y, action, size = 96) {
    // size: tamaño del botón y del icono (puedes aumentarlo)
    var btn = new Sprite_Button();
    var pw = Window_Base._iconWidth;
    var ph = Window_Base._iconHeight;

    // Creamos un bitmap del tamaño deseado
    var bitmap = new Bitmap(size, size);

    // Calculamos el source del icono
    var sx = (iconIndex % 16) * pw;
    var sy = Math.floor(iconIndex / 16) * ph;

    // Dibujamos el icono escalado a todo el bitmap
    bitmap.blt(ImageManager.loadSystem('IconSet'), sx, sy, pw, ph, 0, 0, size, size);

    btn.bitmap = bitmap;

    // Posición del sprite
    btn.x = x -110;
    btn.y = y;

    // No centrar el icono
    btn.anchor.x = 0;
    btn.anchor.y = 0;

    // Hitbox igual al tamaño del bitmap
    btn.hitArea = new PIXI.Rectangle(0, 0, size, size);

    // Animación de pulsar
    btn.update = function() {
        Sprite_Button.prototype.update.call(this);
        if (this._touching) {
            this.scale.set(0.9, 0.9); // se encoge ligeramente al pulsar
            this.opacity = 180;
        } else {
            this.scale.set(1.0, 1.0);
            this.opacity = 255;
        }
    };

    btn.setClickHandler(action);
    return btn;
}

        // ── Botones en el Mapa ──────────────────────────────────────
        var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
        Scene_Map.prototype.createAllWindows = function() {
            _Scene_Map_createAllWindows.call(this);
            
            // Botón Menú (Arriba Derecha)
            this._menuButton = createAnimatedButton(209, Graphics.width - 60, 60, function() {
                if ($gamePlayer.canMove()) {
                    SoundManager.playOk();
                    SceneManager.push(Scene_Menu);
                }
            });
            this.addChild(this._menuButton);

            /* Botón A (Abajo Derecha)
            this._actionButton = createAnimatedButton(84, Graphics.width - 80, Graphics.height - 140, function() {
                // Solo dispara la acción si no hay cooldown
                if (_actionCooldown <= 0) {
                    _actionCooldown = 20; // Bloqueo de 20 frames (aprox 0.3 seg)
                    Input.submitKey('ok');
                }
            });
            this.addChild(this._actionButton);
            */
        };

        // ── Botón Cancelar en Menús ──────────────────────────────────
        var _Scene_MenuBase_create = Scene_MenuBase.prototype.create;
        Scene_MenuBase.prototype.create = function() {
            _Scene_MenuBase_create.call(this);
            if (!(this instanceof Scene_Map)) {
                this._cancelButton = createAnimatedButton(74, Graphics.width - 60, 60, function() {
                    SoundManager.playCancel();
                    SceneManager.pop();
                });
                this.addChild(this._cancelButton);
            }
        };

        // Limpieza de visibilidad
        var _Scene_MenuBase_terminate = Scene_MenuBase.prototype.terminate;
        Scene_MenuBase.prototype.terminate = function() {
            _Scene_MenuBase_terminate.call(this);
            if (SceneManager._scene instanceof Scene_Map && SceneManager._scene._menuButton) {
                SceneManager._scene._menuButton.visible = true;
            }
        };

    })();   
})();