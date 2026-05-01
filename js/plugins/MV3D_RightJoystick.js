/*:
 * @plugindesc Control Dual: Joystick Izquierdo (Movimiento) y Lado Derecho (Cámara).
 * @author Gemini AI
 * 
 * @help
 * - Mitad Izquierda: Joystick dinámico y movimiento. Bloquea la cámara.
 * - Mitad Derecha: Rotación de cámara de MV3D. Bloquea el movimiento por click.
 */

(function() {
    let joystickData = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, identifier: null };
    const JOYSTICK_RADIUS = 60;
    const DEADZONE = 15;

    let container, knob;

    // --- 1. BLOQUEAR EL MOVIMIENTO POR CLICK (DESTINATION) ---
    Scene_Map.prototype.processMapTouch = function() {};

    function createJoystick() {
        container = document.createElement('div');
        container.style.cssText = `
            position: absolute; width: ${JOYSTICK_RADIUS * 2}px; height: ${JOYSTICK_RADIUS * 2}px;
            background: rgba(255,255,255,0.1); border-radius: 50%;
            display: none; z-index: 10000; touch-action: none;
            border: 2px solid rgba(255,255,255,0.3); pointer-events: none;
        `;
        
        knob = document.createElement('div');
        knob.style.cssText = `
            position: absolute; width: 40px; height: 40px;
            background: white; border-radius: 50%; opacity: 0.5;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
        `;
        
        container.appendChild(knob);
        document.body.appendChild(container);
    }

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (!container) createJoystick();
        window.addEventListener('touchstart', onTouchStart, {passive: false});
        window.addEventListener('touchmove', onTouchMove, {passive: false});
        window.addEventListener('touchend', onTouchEnd, {passive: false});
    };

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        _Scene_Map_terminate.call(this);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    };

    function onTouchStart(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            // SI EL TOQUE ES EN LA MITAD IZQUIERDA
            if (touch.clientX < window.innerWidth / 2) {
                // Detenemos que el toque llegue a MV3D (evita mover cámara)
                e.stopPropagation();
                
                joystickData.active = true;
                joystickData.identifier = touch.identifier;
                joystickData.startX = touch.clientX;
                joystickData.startY = touch.clientY;
                
                container.style.display = 'block';
                container.style.left = (touch.clientX - JOYSTICK_RADIUS) + "px";
                container.style.top = (touch.clientY - JOYSTICK_RADIUS) + "px";
                return;
            }
        }
    }

    function onTouchMove(e) {
        if (!joystickData.active) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            if (touch.identifier === joystickData.identifier) {
                // Bloqueamos la propagación para que no mueva la cámara mientras arrastras
                e.stopPropagation();
                
                let dx = touch.clientX - joystickData.startX;
                let dy = touch.clientY - joystickData.startY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist > JOYSTICK_RADIUS) {
                    dx *= JOYSTICK_RADIUS / dist;
                    dy *= JOYSTICK_RADIUS / dist;
                }

                joystickData.curX = dx;
                joystickData.curY = dy;
                knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            }
        }
    }

    function onTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickData.identifier) {
                joystickData.active = false;
                joystickData.identifier = null;
                joystickData.curX = 0;
                joystickData.curY = 0;
                container.style.display = 'none';
            }
        }
    }

    // --- LÓGICA DE MOVIMIENTO DIRECCIONAL ---
    const _Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (joystickData.active) {
            const dx = joystickData.curX;
            const dy = joystickData.curY;
            if (Math.sqrt(dx*dx + dy*dy) < DEADZONE) return 0;

            // Cálculo de dirección (Soporta 4 direcciones básicas)
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? 6 : 4;
            } else {
                return dy > 0 ? 2 : 8;
            }
        }
        return _Game_Player_getInputDirection ? _Game_Player_getInputDirection.call(this) : Input.dir8;
    };

})();