/*:
 * @plugindesc Shield total para MV3D: Mitad Izquierda (Solo Joystick), Mitad Derecha (Solo Cámara).
 * @author Gemini AI
 * 
 * @help
 * - BLOQUEO IZQUIERDO: Cualquier toque en la izquierda no llegará a MV3D.
 * - JOYSTICK: Aparece dinámicamente en la zona bloqueada.
 * - SIN CLICK-TO-MOVE: Se desactiva el movimiento por click para no interferir.
 */

(function() {
    let joystickData = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, identifier: null };
    const JOYSTICK_RADIUS = 60;
    const DEADZONE = 15;

    let container, knob;

    // --- 1. DESACTIVAR CLICK-TO-MOVE NATIVO ---
    Scene_Map.prototype.processMapTouch = function() {};

    function createJoystick() {
        container = document.createElement('div');
        container.style.cssText = `
            position: absolute; width: ${JOYSTICK_RADIUS * 2}px; height: ${JOYSTICK_RADIUS * 2}px;
            background: rgba(255,255,255,0.1); border-radius: 50%;
            display: none; z-index: 100000; touch-action: none;
            border: 2px solid rgba(255,255,255,0.3); pointer-events: none;
        `;
        
        knob = document.createElement('div');
        knob.style.cssText = `
            position: absolute; width: 40px; height: 40px;
            background: white; border-radius: 50%; opacity: 0.6;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
        `;
        
        container.appendChild(knob);
        document.body.appendChild(container);
    }

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        if (!container) createJoystick();
        
        // INTERCEPCIÓN AGRESIVA (Fase de captura: true)
        // Escuchamos en el documento para atrapar el evento antes que Babylon.js/MV3D
        document.addEventListener('touchstart', onTouchStart, {passive: false, capture: true});
        document.addEventListener('touchmove', onTouchMove, {passive: false, capture: true});
        document.addEventListener('touchend', onTouchEnd, {passive: false, capture: true});
        document.addEventListener('touchcancel', onTouchEnd, {passive: false, capture: true});
    };

    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        _Scene_Map_terminate.call(this);
        document.removeEventListener('touchstart', onTouchStart, true);
        document.removeEventListener('touchmove', onTouchMove, true);
        document.removeEventListener('touchend', onTouchEnd, true);
        document.removeEventListener('touchcancel', onTouchEnd, true);
    };

    function onTouchStart(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            // SI EL DEDO ESTÁ EN LA MITAD IZQUIERDA
            if (touch.clientX < window.innerWidth / 2) {
                // ESTO "MATA" EL EVENTO PARA MV3D:
                e.stopImmediatePropagation();
                // Opcional: e.preventDefault(); // Descomentar si el navegador hace scroll
                
                if (!joystickData.active) {
                    joystickData.active = true;
                    joystickData.identifier = touch.identifier;
                    joystickData.startX = touch.clientX;
                    joystickData.startY = touch.clientY;
                    
                    container.style.display = 'block';
                    container.style.left = (touch.clientX - JOYSTICK_RADIUS) + "px";
                    container.style.top = (touch.clientY - JOYSTICK_RADIUS) + "px";
                }
            }
        }
    }

    function onTouchMove(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            // Si es el dedo que controla el joystick
            if (touch.identifier === joystickData.identifier) {
                // Bloqueamos la propagación para que MV3D no mueva la cámara
                e.stopImmediatePropagation();
                
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
            } else if (touch.clientX < window.innerWidth / 2) {
                // Bloqueo preventivo para cualquier otro dedo en la zona izquierda
                e.stopImmediatePropagation();
            }
        }
    }

    function onTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickData.identifier) {
                e.stopImmediatePropagation();
                joystickData.active = false;
                joystickData.identifier = null;
                joystickData.curX = 0;
                joystickData.curY = 0;
                container.style.display = 'none';
            } else if (touch.clientX < window.innerWidth / 2) {
                e.stopImmediatePropagation();
            }
        }
    }

    // --- CONEXIÓN CON EL MOVIMIENTO ---
    const _Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (joystickData.active) {
            const dx = joystickData.curX;
            const dy = joystickData.curY;
            if (Math.sqrt(dx*dx + dy*dy) < DEADZONE) return 0;
            if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 6 : 4;
            return dy > 0 ? 2 : 8;
        }
        return _Game_Player_getInputDirection ? _Game_Player_getInputDirection.call(this) : Input.dir8;
    };

})();