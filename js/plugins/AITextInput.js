var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // 1. EL FONDO: Ahora con 'pointer-events: auto' para que deje pasar clics a sus hijos
        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;';

        // 2. LA CAJA: Contenedor del teclado
        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:16px;width:95%;max-width:500px;box-sizing:border-box;';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:12px;margin:0 0 10px 0;text-align:center;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:2px;padding:8px;min-height:15px;color:#ffffff;font-size:12px;margin-bottom:8px;word-break:break-all;pointer-events:none;';

        var text = '';
        function updateScreen() { screen.textContent = text || ''; }

        // Manejo de teclado físico corregido
        function onKeyDown(e) {
            if (e.key === 'Enter') confirm();
            else if (e.key === 'Backspace') { text = text.slice(0, -1); updateScreen(); }
            else if (e.key.length === 1 && text.length < 80) { text += e.key; updateScreen(); }
            e.stopPropagation(); 
        }
        document.addEventListener('keydown', onKeyDown);

        function confirm() {
            if (text.trim() === '') return;
            $gameVariables._data[2] = text.trim();
            document.removeEventListener('keydown', onKeyDown);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        var btnStyle = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:12px 4px;font-size:14px;cursor:pointer;flex:1;margin:2px;min-width:28px;touch-action:manipulation;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:4px;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                
                // Estilos visuales
                if (key === 'CONFIRMAR') {
                    btn.style.cssText = 'background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:12px 16px;font-size:14px;cursor:pointer;font-weight:bold;margin:2px;flex:2;';
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnStyle + 'flex:3;';
                } else if (key === '⌫') {
                    btn.style.cssText = btnStyle + 'flex:1.5;';
                } else {
                    btn.style.cssText = btnStyle;
                }

                // FUNCIÓN DE PULSACIÓN: Usamos 'pointerdown' que cubre ratón y táctil
                btn.addEventListener('pointerdown', function(e) {
                    e.preventDefault();   // Evita que el juego reciba el clic
                    e.stopPropagation();  // Evita que otros plugins lo detecten
                    
                    if (key === 'CONFIRMAR') {
                        confirm();
                    } else if (key === 'ESPACIO') {
                        if (text.length < 80) { text += ' '; updateScreen(); }
                    } else if (key === '⌫') {
                        text = text.slice(0, -1); updateScreen();
                    } else {
                        if (text.length < 80) { text += key.toLowerCase(); updateScreen(); }
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

        // Bloquear toques que salgan del área del teclado
        overlay.addEventListener('pointerdown', function(e) {
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
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