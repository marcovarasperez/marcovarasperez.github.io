var AITextInput = AITextInput || {};

(function () {

    AITextInput.showInput = function (interpreter) {
        interpreter.setWaitMode('ai_input');

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        // Usamos flex y un fondo oscuro para aislar el teclado del resto del juego
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        // USAMOS MEDIDAS FIJAS PEQUEÑAS (px) PERO CON UN MAX-WIDTH EN VW PARA MÓVIL
        // Esto evita que se estire infinito en pantallas grandes pero se encoge en pequeñas.
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:10px;width:90vw;max-width:320px;box-sizing:border-box;box-shadow: 0 0 15px rgba(0,0,0,1);';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:12px;margin:0 0 8px 0;text-align:center;font-weight:bold;text-transform:uppercase;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:6px;min-height:18px;max-height:40px;color:#ffffff;font-size:13px;margin-bottom:10px;word-break:break-all;overflow:hidden;';

        var text = '';
        function updateScreen() { screen.textContent = text || ''; }

        function confirm() {
            if (text.trim() === '') return;
            $gameVariables._data[2] = text.trim();
            document.removeEventListener('keydown', onKeyDown);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

        function onKeyDown(e) {
            if (e.key === 'Enter') confirm();
            else if (e.key === 'Backspace') { text = text.slice(0, -1); updateScreen(); }
            else if (e.key.length === 1 && text.length < 50) { text += e.key; updateScreen(); }
            e.stopPropagation();
        }
        document.addEventListener('keydown', onKeyDown);

        var rows = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
            ['ESPACIO', 'CONFIRMAR']
        ];

        // BOTONES MUCHO MÁS PEQUEÑOS Y COMPACTOS
        var btnBase = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:8px 0;font-size:11px;cursor:pointer;flex:1;margin:1px;height:35px;box-sizing:border-box;touch-action:manipulation;';

        rows.forEach(function (row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;width:100%;';

            row.forEach(function (key) {
                var btn = document.createElement('button');
                btn.textContent = key;

                if (key === 'CONFIRMAR') {
                    btn.style.cssText = btnBase + 'background:#e0c97f;color:#1a1a2e;font-weight:bold;flex:2;';
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnBase + 'flex:3;';
                } else if (key === '⌫') {
                    btn.style.cssText = btnBase + 'flex:1.5;';
                } else {
                    btn.style.cssText = btnBase;
                }

                btn.addEventListener('pointerdown', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === 'CONFIRMAR') confirm();
                    else if (key === 'ESPACIO') { if (text.length < 50) { text += ' '; updateScreen(); } }
                    else if (key === '⌫') { text = text.slice(0, -1); updateScreen(); }
                    else { if (text.length < 50) { text += key.toUpperCase(); updateScreen(); } }
                });

                rowDiv.appendChild(btn);
            });
            box.appendChild(rowDiv);
        });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') AITextInput.showInput(this);
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
        return (this._waitMode === 'ai_input') ? true : _updateWaitMode.call(this);
    };
    var screen = document.createElement('div'); // O 'input' si lo cambias
    screen.setAttribute('autocorrect', 'off');
    screen.setAttribute('autocapitalize', 'none');
    screen.setAttribute('spellcheck', 'false');
    // El resto de tus estilos...
    screen.style.cssText = '...';
}());