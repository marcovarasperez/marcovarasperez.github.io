var AITextInput = AITextInput || {};

(function() {

    // Función unificada para clics y toques
    function addTapHandler(btn, fn) {
        // Pointerdown es compatible con ratón y pantallas táctiles modernas
        btn.addEventListener('pointerdown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fn();
        }, { passive: false });
    }

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var text = '';

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        // Añadido: touch-action: none para evitar que el scroll del móvil interfiera
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:15px;width:95%;max-width:400px;box-sizing:border-box;box-shadow: 0 0 20px rgba(0,0,0,0.5);';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:16px;margin:0 0 10px 0;text-align:center;font-family:sans-serif;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:10px;min-height:40px;color:#fff;font-size:16px;margin-bottom:12px;word-break:break-all;font-family:monospace;';
        screen.textContent = '';

        function updateScreen() {
            screen.textContent = text;
        }

        function onConfirm() {
            if (text.trim() === '') return;
            $gameVariables.setValue(2, text.trim());
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            interpreter.setWaitMode('');
        }

        var baseStyle = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:12px 2px;font-size:14px;font-weight:bold;cursor:pointer;flex:1;margin:2px;min-width:30px;user-select:none;-webkit-user-select:none;touch-action:manipulation;';

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:5px;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                btn.type = "button"; // Evita comportamientos de formulario por defecto

                if (key === 'CONFIRMAR') {
                    btn.style.cssText = baseStyle + 'background:#e0c97f;color:#1a1a2e;flex:2;';
                    addTapHandler(btn, onConfirm);
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = baseStyle + 'flex:3;';
                    addTapHandler(btn, function() { if (text.length < 80) { text += ' '; updateScreen(); } });
                } else if (key === '⌫') {
                    btn.style.cssText = baseStyle + 'flex:1.5;';
                    addTapHandler(btn, function() { text = text.slice(0, -1); updateScreen(); });
                } else {
                    btn.style.cssText = baseStyle;
                    var k = key; // Captura de variable para el closure
                    addTapHandler(btn, function() { 
                        if (text.length < 80) { 
                            text += k.toLowerCase(); 
                            updateScreen(); 
                        } 
                    });
                }
                rowDiv.appendChild(btn);
            });
            box.appendChild(rowDiv);
        });

        // Bloquear inputs del juego mientras el teclado está abierto
        overlay.addEventListener('pointerdown', function(e) { e.stopPropagation(); }, { passive: false });
        overlay.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: false });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Soporte teclado físico
        var onKey = function(e) {
            if (!document.getElementById('ai-input-overlay')) {
                document.removeEventListener('keydown', onKey);
                return;
            }
            if (e.key === 'Enter') onConfirm();
            else if (e.key === 'Backspace') { text = text.slice(0, -1); updateScreen(); }
            else if (e.key.length === 1 && text.length < 80) { text += e.key; updateScreen(); }
            e.stopPropagation();
        };
        document.addEventListener('keydown', onKey);
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') AITextInput.showInput(this);
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_input') {
            if (document.getElementById('ai-input-overlay')) return true;
            this._waitMode = '';
            return false;
        }
        return _updateWaitMode.call(this);
    };

}());