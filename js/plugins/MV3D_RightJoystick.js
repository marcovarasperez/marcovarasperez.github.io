/*:
 * @plugindesc Joystick táctil en el lado derecho para movimiento 3D (Compatible con MV3D).
 * @author Gemini AI / RPG Maker Hybrid
 * 
 * @help
 * Este plugin añade un joystick en la mitad derecha de la pantalla.
 * Ideal para configuraciones donde la mano izquierda se usa para la cámara
 * y la derecha para el movimiento, o viceversa en juegos 3D.
 */

(function() {
    let joystickData = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };
    const JOYSTICK_RADIUS = 50; // Tamaño del joystick
    const DEADZONE = 10;

    // Crear el contenedor visual del joystick
    let container, knob;

    function createJoystick() {
        container = document.createElement('div');
        container.style.cssText = `
            position: absolute; bottom: 100px; right: 100px;
            width: ${JOYSTICK_RADIUS * 2}px; height: ${JOYSTICK_RADIUS * 2}px;
            background: rgba(255,255,255,0.2); border-radius: 50%;
            display: none; z-index: 1000; touch-action: none;
            border: 2px solid rgba(255,255,255,0.4);
        `;
        
        knob = document.createElement('div');
        knob.style.cssText = `
            position: absolute; width: 40px; height: 40px;
            background: white; border-radius: 50%; opacity: 0.7;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
        `;
        
        container.appendChild(knob);
        document.body.appendChild(container);
    }

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (!container) createJoystick();
        container.style.display = 'block';
        window.addEventListener('touchstart', onTouchStart, {passive: false});
        window.addEventListener('touchmove', onTouchMove, {passive: false});
        window.addEventListener('touchend', onTouchEnd);
    };

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        _Scene_Map_terminate.call(this);
        if (container) container.style.display = 'none';
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    };

    function onTouchStart(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            // Solo activar si el toque es en la mitad derecha
            if (touch.clientX > window.innerWidth / 2) {
                joystickData.active = true;
                joystickData.startX = touch.clientX;
                joystickData.startY = touch.clientY;
                container.style.left = (touch.clientX - JOYSTICK_RADIUS) + "px";
                container.style.top = (touch.clientY - JOYSTICK_RADIUS) + "px";
                return;
            }
        }
    }

    function onTouchMove(e) {
        if (!joystickData.active) return;
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => t.clientX > window.innerWidth / 4); 
        if (!touch) return;

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

    function onTouchEnd() {
        joystickData.active = false;
        joystickData.curX = 0;
        joystickData.curY = 0;
        knob.style.transform = `translate(-50%, -50%)`;
    }

    // Inyectar el movimiento en el sistema de RPG Maker
    const _Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.getInputDirection = function() {
        if (joystickData.active) {
            const dx = joystickData.curX;
            const dy = joystickData.curY;
            if (Math.abs(dx) < DEADZONE && Math.abs(dy) < DEADZONE) return 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? 6 : 4;
            } else {
                return dy > 0 ? 2 : 8;
            }
        }
        return Input.dir8;
    };

})();