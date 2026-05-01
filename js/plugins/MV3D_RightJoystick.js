/*:
 * @plugindesc Joystick Izquierdo (Movimiento) y Lado Derecho (Cámara) para MV3D.
 * @author Gemini AI
 * 
 * @help
 * - Mitad Izquierda: Aparece el joystick y mueve al personaje.
 * - Mitad Derecha: Se ignora el joystick y MV3D rota la cámara.
 * - Elimina el movimiento por click para evitar conflictos.
 */

(function() {
    let joystickData = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, identifier: null };
    const JOYSTICK_RADIUS = 60;
    const DEADZONE = 15;

    let container, knob;

    // --- 1. BLOQUEAR MOVIMIENTO POR CLICK (PATHFINDING) ---
    // Esto es vital para que al tocar la derecha para rotar, el personaje no camine.
    Scene_Map.prototype.processMapTouch = function() {};

    function createJoystick() {
        container = document.createElement('div');
        container.style.cssText = `
            position: absolute; 
            width: ${JOYSTICK_RADIUS * 2}px; 
            height: ${JOYSTICK_RADIUS * 2}px;
            background: rgba(255,255,255,0.1); 
            border-radius: 50%;
            display: none; 
            z-index: 10000; 
            touch-action: none;
            border: 2px solid rgba(255,255,255,0.3); 
            pointer-events: none;
        `;
        
        knob = document.createElement('div');
        knob.style.cssText = `
            position: absolute; 
            width: 40px; 
            height: 40px;
            background: white; 
            border-radius: 50%; 
            opacity: 0.6;
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
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
            
            // FILTRO: Solo actuar si el toque ocurre en la mitad IZQUIERDA
            if (touch.clientX < window.innerWidth / 2) {
                // Importante: stopPropagation evita que MV3D rote la cámara con este dedo
                e.stopPropagation();
                
                joystickData.active = true;
                joystickData.identifier = touch.identifier;
                joystickData.startX = touch.clientX;
                joystickData.startY = touch.clientY;
                
                container.style.display = 'block';
                // Posicionamos el joystick justo bajo el dedo
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
                // Bloqueamos el evento para que no afecte a la cámara
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

    // --- INTEGRACIÓN CON EL MOVIMIENTO ---
    const _Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (joystickData.active) {
            const dx = joystickData.curX;
            const dy = joystickData.curY;
            if (Math.sqrt(dx*dx + dy*dy) < DEADZONE) return 0;

            // Determinamos la dirección (4 direcciones)
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? 6 : 4; // Derecha o Izquierda
            } else {
                return dy > 0 ? 2 : 8; // Abajo o Arriba
            }
        }
        // Si no hay joystick, usamos el input normal (teclado/pad)
        return _Game_Player_getInputDirection ? _Game_Player_getInputDirection.call(this) : Input.dir8;
    };

})();