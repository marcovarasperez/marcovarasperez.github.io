/*:
 * @plugindesc Barra de entrada de texto que usa el teclado nativo (Móvil/PC).
 * @author Gemini AI
 * * @help Comando de Play: NATIVE_INPUT
 * El texto se guarda en la Variable 2.
 */

var NativeTextInput = NativeTextInput || {};

(function() {

    NativeTextInput.show = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // 1. EL OVERLAY (Fondo que bloquea el juego)
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:20vh;touch-action:none;';

        // 2. CONTENEDOR DE LA BARRA
        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:10px;width:90vw;max-width:400px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 20px rgba(0,0,0,0.5);';

        var title = document.createElement('p');
        title.textContent = '¿Sobre que quieres hablar?';
        title.style.cssText = 'color:#e0c97f;font-size:14px;margin:0;text-align:left;font-family:sans-serif;';

        // 3. EL INPUT REAL (El que activa el teclado del móvil)
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Escribe tu mensaje...';
        // Atributos para el autocorrector (aquí sí puedes decidir si activarlo o no)
        input.setAttribute('autocorrect', 'on'); 
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'true');
        
        input.style.cssText = 'width:100%;background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:12px;color:#ffffff;font-size:16px;box-sizing:border-box;outline:none;';

        // 4. BOTÓN DE CONFIRMAR
        var btn = document.createElement('button');
        btn.textContent = 'ACEPTAR';
        btn.style.cssText = 'width:100%;background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:10px;font-weight:bold;cursor:pointer;font-size:14px;';

        // Lógica de cierre
        var finish = function() {
            var val = input.value.trim();
            if (val !== "") {
                $gameVariables.setValue(2, val); // Guarda en Variable 2
                document.body.removeChild(overlay);
                interpreter.setWaitMode('');
            }
        };

        // Eventos
        btn.onclick = finish;
        input.onkeydown = function(e) {
            if (e.key === 'Enter') finish();
            e.stopPropagation(); // Evita que el juego reciba las teclas
        };

        // Construcción
        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // FORZAR EL TECLADO EN MÓVIL
        setTimeout(function() {
            input.focus();
            input.click(); // Algunos navegadores móviles requieren un clic para abrir teclado
        }, 100);

        // Cerrar si tocas fuera (opcional)
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                interpreter.setWaitMode('');
            }
        };
    };

    // Comando de Plugin
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'NATIVE_INPUT') {
            NativeTextInput.show(this);
        }
    };

    // Registrar el modo de espera
    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_input') return true;
        return _updateWaitMode.call(this);
    };

})();