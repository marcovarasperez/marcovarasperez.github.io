/*:
 * @plugindesc Battleback stretch + centra combate para 1280x720
 * @author Fix
 */
(function() {

    // ═══════════════════════════════════════
    // BATTLEBACK STRETCH
    // ═══════════════════════════════════════

    var _Spriteset_Battle_createBattleback = Spriteset_Battle.prototype.createBattleback;
    Spriteset_Battle.prototype.createBattleback = function() {
        _Spriteset_Battle_createBattleback.call(this);
        this.stretchBattlebackSprites();
    };

    Spriteset_Battle.prototype.stretchBattlebackSprites = function() {
        var sprites = [this._back1Sprite, this._back2Sprite];
        sprites.forEach(function(sprite) {
            if (!sprite) return;
            if (sprite.bitmap && sprite.bitmap.isReady()) {
                stretchSprite(sprite);
            } else if (sprite.bitmap) {
                sprite.bitmap.addLoadListener(function() {
                    stretchSprite(sprite);
                });
            }
        });
    };

    var _Spriteset_Battle_updateBattleback = Spriteset_Battle.prototype.updateBattleback;
    Spriteset_Battle.prototype.updateBattleback = function() {
        _Spriteset_Battle_updateBattleback.call(this);
        if (this._back1Sprite) { this._back1Sprite.origin.x = 0; this._back1Sprite.origin.y = 0; }
        if (this._back2Sprite) { this._back2Sprite.origin.x = 0; this._back2Sprite.origin.y = 0; }
    };

    function stretchSprite(sprite) {
        sprite.anchor.x = 0;
        sprite.anchor.y = 0;
        sprite.origin.x = 0;
        sprite.origin.y = 0;
        sprite.x = 0;
        sprite.y = 0;
        sprite.scale.x = Graphics.width  / sprite.bitmap.width;
        sprite.scale.y = Graphics.height / sprite.bitmap.height;
    }

    // ═══════════════════════════════════════
    // CENTRADO DE ENEMIGOS Y ACTORES
    // ═══════════════════════════════════════

    var _Game_Enemy_screenX = Game_Enemy.prototype.screenX;
    Game_Enemy.prototype.screenX = function() {
        var offsetX = (Graphics.width - 816) / 2 -150;
        return _Game_Enemy_screenX.call(this) + offsetX;
    };

    var _Game_Enemy_screenY = Game_Enemy.prototype.screenY;
    Game_Enemy.prototype.screenY = function() {
        var offsetY = (Graphics.height - 624) / 2;
        return _Game_Enemy_screenY.call(this) + offsetY;
    };

    var _Game_Actor_screenX = Game_Actor.prototype.screenX;
    Game_Actor.prototype.screenX = function() {
        var offsetX = (Graphics.width - 816) / 2 + 100;
        return _Game_Actor_screenX.call(this) + offsetX;
    };

    var _Game_Actor_screenY = Game_Actor.prototype.screenY;
    Game_Actor.prototype.screenY = function() {
        var offsetY = (Graphics.height - 624) / 2;
        return _Game_Actor_screenY.call(this) + offsetY;
    };
var _Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
    Sprite_Actor.prototype.setActorHome = function(index) {
        _Sprite_Actor_setActorHome.call(this, index);
        this._homeX += 250;
        this._homeY += 50;
    };
})();