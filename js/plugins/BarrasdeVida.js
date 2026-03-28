//=============================================================================
// EnemyHPBar.js
//=============================================================================
/*:
 * @plugindesc Muestra barras de vida debajo de cada enemigo en combate
 * @author TuNombre
 *
 * @param Bar Width
 * @desc Ancho de la barra de vida en píxeles
 * @default 200
 *
 * @param Bar Height
 * @desc Alto de la barra de vida en píxeles
 * @default 20
 *
 * @param Bar Y Offset
 * @desc Distancia por debajo del sprite visible del enemigo
 * @default 5
 *
 * @param Color High
 * @desc Color cuando la vida es alta (CSS)
 * @default #22cc22
 *
 * @param Color Mid
 * @desc Color cuando la vida es media (CSS)
 * @default #cccc00
 *
 * @param Color Low
 * @desc Color cuando la vida es baja (CSS)
 * @default #cc2222
 *
 * @param Damage Color
 * @desc Color de la barra de daño pendiente (CSS)
 * @default #ff8800
 *
 * @param Background Color
 * @desc Color del fondo de la barra (CSS)
 * @default #111111
 *
 * @param Show Name
 * @desc Mostrar nombre del enemigo. true / false
 * @default true
 *
 * @param Show HP Number
 * @desc Mostrar el número de HP. true / false
 * @default true
 *
 * @param Drain Speed
 * @desc Velocidad de la animación de daño (0.01 lento - 0.05 rápido)
 * @default 0.02
 *
 * @help Coloca este plugin en la lista de plugins y actívalo.
 * No requiere configuración adicional.
 */

(function() {

    var parameters      = PluginManager.parameters('EnemyHPBar');
    var barWidth        = Number(parameters['Bar Width']        || 200);
    var barHeight       = Number(parameters['Bar Height']       || 20);
    var barYOffset      = Number(parameters['Bar Y Offset']     || 5);
    var colorHigh       = String(parameters['Color High']       || '#22cc22');
    var colorMid        = String(parameters['Color Mid']        || '#cccc00');
    var colorLow        = String(parameters['Color Low']        || '#cc2222');
    var damageColor     = String(parameters['Damage Color']     || '#ff8800');
    var backgroundColor = String(parameters['Background Color'] || '#111111');
    var showName        = String(parameters['Show Name']        || 'true') === 'true';
    var showHPNumber    = String(parameters['Show HP Number']   || 'true') === 'true';
    var drainSpeed      = Number(parameters['Drain Speed']      || 0.02);

    var nameH  = showName      ? 24 : 0;
    var hpNumH = showHPNumber  ? 24 : 0;

    //=============================================================================
    // Sprite_Enemy
    //=============================================================================

    var _Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
    Sprite_Enemy.prototype.initMembers = function() {
        _Sprite_Enemy_initMembers.call(this);
        this._hpBarSprite = null;
        this._hpBarRate   = 1.0;
        this._hpBarDrain  = 1.0;
        this._hpBarTarget = 1.0;
    };

    var _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);
        if (this._enemy) {
            this.updateHPBar();
        }
    };

    Sprite_Enemy.prototype.updateHPBar = function() {
        if (!this._hpBarSprite) {
            this.createHPBar();
        }

        var realRate = this._enemy.isDead() ? 0 : this._enemy.hpRate();

        // Daño recibido: barra real salta al nuevo valor,
        // barra naranja se queda en el anterior y baja despacio
        if (realRate < this._hpBarTarget) {
            this._hpBarDrain  = this._hpBarTarget;
            this._hpBarRate   = realRate;
            this._hpBarTarget = realRate;
        }

        // Curación: todo salta directo sin animación
        if (realRate > this._hpBarTarget) {
            this._hpBarRate   = realRate;
            this._hpBarDrain  = realRate;
            this._hpBarTarget = realRate;
        }

        // Animar barra naranja bajando despacio
        if (this._hpBarDrain > this._hpBarRate) {
            this._hpBarDrain = Math.max(
                this._hpBarRate,
                this._hpBarDrain - drainSpeed
            );
        }

        this.refreshHPBar();
    };

    Sprite_Enemy.prototype.getEnemySpriteBottom = function() {
        // Calcula el borde inferior real del sprite visible del enemigo.
        // El anchor por defecto de Sprite_Enemy es (0.5, 1) así que
        // y=0 ya es el borde inferior del sprite — solo añadimos el offset.
        return barYOffset;
    };

    Sprite_Enemy.prototype.createHPBar = function() {
        var totalH = nameH + hpNumH + barHeight + 6;
        var bitmap = new Bitmap(barWidth + 4, totalH);

        this._hpBarSprite          = new Sprite(bitmap);
        this._hpBarSprite.anchor.x = 0.5;
        this._hpBarSprite.anchor.y = 0.0;
        this._hpBarSprite.x        = 0;
        this._hpBarSprite.y        = this.getEnemySpriteBottom();

        this._hpBarRate   = this._enemy ? this._enemy.hpRate() : 1.0;
        this._hpBarDrain  = this._hpBarRate;
        this._hpBarTarget = this._hpBarRate;

        // Hijo directo del sprite del enemigo — se mueve con él
        this.addChild(this._hpBarSprite);
    };

    Sprite_Enemy.prototype.refreshHPBar = function() {
        if (!this._hpBarSprite) return;

        var enemy  = this._enemy;
        var bitmap = this._hpBarSprite.bitmap;
        var bw     = barWidth;
        var bh     = barHeight;
        var barY   = nameH + hpNumH;

        // Mantener posición relativa actualizada
        this._hpBarSprite.x = 0;
        this._hpBarSprite.y = this.getEnemySpriteBottom();

        bitmap.clear();

        // ── Nombre del enemigo ──────────────────────────────────────────
        if (showName) {
            bitmap.fontSize     = 18;
            bitmap.textColor    = '#ffffff';
            bitmap.outlineColor = 'rgba(0,0,0,1)';
            bitmap.outlineWidth = 4;
            bitmap.drawText(
                enemy.name(),
                0, 0, bw + 4, nameH, 'center'
            );
        }

        // ── Número HP actual / máximo ───────────────────────────────────
        if (showHPNumber) {
            var hpText = enemy.isDead()
                ? '0 / ' + enemy.mhp
                : enemy.hp + ' / ' + enemy.mhp;
            bitmap.fontSize     = 18;
            bitmap.textColor    = '#ffffff';
            bitmap.outlineColor = 'rgba(0,0,0,1)';
            bitmap.outlineWidth = 4;
            bitmap.drawText(
                hpText,
                0, nameH, bw + 4, hpNumH, 'center'
            );
        }

        // ── Borde exterior ──────────────────────────────────────────────
        bitmap.fillRect(0, barY, bw + 4, bh + 4, '#444444');

        // ── Fondo interior ──────────────────────────────────────────────
        bitmap.fillRect(2, barY + 2, bw, bh, backgroundColor);

        // ── Barra naranja de daño pendiente ─────────────────────────────
        var drainWidth = Math.floor(bw * this._hpBarDrain);
        if (drainWidth > 0) {
            bitmap.fillRect(2, barY + 2, drainWidth, bh, damageColor);
        }

        // ── Color de la barra según porcentaje de vida ──────────────────
        var rate = this._hpBarRate;
        var color;
        if (rate > 0.5) {
            color = colorHigh;
        } else if (rate > 0.25) {
            color = colorMid;
        } else {
            color = colorLow;
        }

        // ── Barra de vida real ──────────────────────────────────────────
        var fillWidth = Math.floor(bw * rate);
        if (fillWidth > 0) {
            bitmap.fillRect(2, barY + 2, fillWidth, bh, color);
        }

        // ── Ocultar si está muerto ──────────────────────────────────────
        this._hpBarSprite.visible = !enemy.isDead();
    };

    // Limpiar al cambiar de battler
    var _Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function(battler) {
        _Sprite_Enemy_setBattler.call(this, battler);
        if (this._hpBarSprite) {
            this.removeChild(this._hpBarSprite);
            this._hpBarSprite = null;
        }
        this._hpBarRate   = 1.0;
        this._hpBarDrain  = 1.0;
        this._hpBarTarget = 1.0;
    };

})();