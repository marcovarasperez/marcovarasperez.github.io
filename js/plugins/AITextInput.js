var NativeTextInput = NativeTextInput || {};

(function() {

    NativeTextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('native_input');

        var overlay = document.createElement('div');
        overlay.id = 'native-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:10px;padding:15px;width:90vw;max-width:400px;box-sizing:border-box;box-shadow:0 5px 25px rgba(0,0,0,0.8);';

        var title = document.createElement('p');
        title.textContent = 'Escribe tu mensaje:';
        title.style.cssText = 'color:#e0c97f;font-size:14px;margin:0 0 10px 0;font-family:sans-serif;font-weight:bold;';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'native-input-field';
        input.placeholder = 'Toca para escribir...';
        input.setAttribute('autocorrect', 'on');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'true');
        input.style.cssText = 'width:100%;background:#0f0f1a;border:1px solid #e0c97f;border-radius:5px;padding:12px;color:#ffffff;font-size:16px;box-sizing:border-box;outline:none;margin-bottom:15px;';

        var btnConfirm = document.createElement('button');
        btnConfirm.textContent = 'ACEPTAR';
        btnConfirm.style.cssText = 'width:100%;background:#e0c97f;color:#1a1a2e;border:none;border-radius:5px;padding:12px;font-weight:bold;cursor:pointer;font-size:14px;touch-action:manipulation;';

        var closed = false;
        var closeAndSave = function() {
            if (closed) return;
            closed = true;
            var finalValue = input.value.trim();
            $gameVariables.setValue(2, finalValue);
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            interpreter.setWaitMode('');
        };

        // Confirmar con touchstart en móvil (sin delay)
        btnConfirm.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            input.blur();
            closeAndSave();
        }, { passive: false });

        // Confirmar con click en PC
        btnConfirm.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAndSave();
        });

        // Enter en teclado físico
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
                closeAndSave();
            }
            e.stopPropagation();
        });

        // Tocar la barra reabre el teclado
        input.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            input.focus();
        }, { passive: true });

        // Evitar que toques en overlay pasen al juego
        overlay.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });

        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(btnConfirm);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        setTimeout(function() { input.focus(); }, 200);
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'NATIVE_INPUT') {
            NativeTextInput.showInput(this);
        }
    };

    var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'native_input') {
            if (document.getElementById('native-input-overlay')) return true;
            this._waitMode = '';
            return false;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

})();