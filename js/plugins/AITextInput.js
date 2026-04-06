var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var isMobile = window.innerWidth < 768;

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:100000;display:flex;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        // Mantenemos el ancho compacto al 85% en móvil
        var boxWidth = isMobile ? '85vw' : '360px'; 
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:8px;width:' + boxWidth + ';max-width:420px;box-sizing:border-box;';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:10px;margin:0 0 5px 0;text-align:center;text-transform:uppercase;';

        var screen = document.createElement('input');
        screen.type = 'text';
        screen.readOnly = true;
        screen.setAttribute('autocorrect', 'off');
        screen.setAttribute('spellcheck', 'false');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:4px;height:26px;width:100%;color:#ffffff;font-size:12px;margin-bottom:8px;box-sizing:border-box;text-align:center;';

        var text = '';
        function updateScreen() { screen.value = text || ''; }

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
            else if (e.key.length === 1 && text.length < 60) { text += e.key; updateScreen(); }
            e.stopPropagation(); 
        }
        document.addEventListener('keydown', onKeyDown);

        // FILAS ACTUALIZADAS (Añadido el punto y coma ';')
        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M',',','.',';'], // Fila de puntuación 1
            ['¿','?','¡','!','-',':','ESPACIO','⌫'],     // Fila de puntuación 2
            ['CONFIRMAR']
        ];

        var btnPadding = isMobile ? '4px 0' : '8px 0';
        var btnFontSize = isMobile ? '10px' : '13px';
        var btnHeight = isMobile ? '28px' : '36px';

        var btnBase = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:' + btnPadding + ';font-size:' + btnFontSize + ';height:' + btnHeight + ';cursor:pointer;flex:1;margin:1px;box-sizing:border-box;touch-action:manipulation;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;width:100%;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                
                if (key === 'CONFIRMAR') {
                    btn.style.cssText = btnBase + 'background:#e0c97f;color:#1a1a2e;font-weight:bold;width:100%;flex:none;margin-top:4px;';
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnBase + 'flex:2.2;';
                } else if (key === '⌫') {
                    btn.style.cssText = btnBase + 'flex:1.2; background:#4e2a2a;'; 
                } else {
                    btn.style.cssText = btnBase;
                }

                btn.addEventListener('pointerdown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === 'CONFIRMAR') {
                        confirm();
                    } else if (key === 'ESPACIO') {
                        if (text.length < 60) { text += ' '; updateScreen(); }
                    } else if (key === '⌫') {
                        text = text.slice(0, -1); updateScreen();
                    } else {
                        // Letras a minúscula, símbolos se mantienen
                        var char = (key.length === 1 && /[A-ZÑ]/.test(key)) ? key.toLowerCase() : key;
                        if (text.length < 60) { text += char; updateScreen(); }
                    }
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
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') AITextInput.showInput(this);
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        return (this._waitMode === 'ai_input') ? true : _updateWaitMode.call(this);
    };
}());