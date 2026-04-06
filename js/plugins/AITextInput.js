var AITextInput = AITextInput || {};

(function() {

    // Detectar si es móvil
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    function addTapHandler(btn, fn) {
        if (isMobile) {
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fn();
            }, { passive: false });
        } else {
            btn.onclick = fn;
        }
    }

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var text = '';

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:10px;width:90%;max-width:380px;box-sizing:border-box;';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:13px;margin:0 0 6px 0;text-align:center;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:6px 8px;min-height:30px;color:#fff;font-size:13px;margin-bottom:8px;word-break:break-all;';
        screen.textContent = '';

        function updateScreen() {
            screen.textContent = text;
        }

        function onConfirm() {
            if (text.trim() === '') return;
            $gameVariables.setValue(2, text.trim());
            document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

        var base = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:6px 2px;font-size:12px;cursor:pointer;flex:1;margin:1px;min-width:24px;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:3px;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;

                if (key === 'CONFIRMAR') {
                    btn.style.cssText = 'background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:8px 12px;font-size:12px;font-weight:bold;cursor:pointer;margin:1px;flex:2;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';
                    addTapHandler(btn, onConfirm);
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = base + 'flex:3;';
                    addTapHandler(btn, function() { if (text.length < 80) { text += ' '; updateScreen(); } });
                } else if (key === '⌫') {
                    btn.style.cssText = base + 'flex:1.5;';
                    addTapHandler(btn, function() { text = text.slice(0, -1); updateScreen(); });
                } else {
                    btn.style.cssText = base;
                    var k = key;
                    addTapHandler(btn, function() { if (text.length < 80) { text += k.toLowerCase(); updateScreen(); } });
                }

                rowDiv.appendChild(btn);
            });

            box.appendChild(rowDiv);
        });

        // Teclado físico PC
        document.addEventListener('keydown', function onKey(e) {
            if (!document.getElementById('ai-input-overlay')) {
                document.removeEventListener('keydown', onKey);
                return;
            }
            e.stopPropagation();
            if (e.key === 'Enter') onConfirm();
            else if (e.key === 'Backspace') { text = text.slice(0, -1); updateScreen(); }
            else if (e.key.length === 1 && text.length < 80) { text += e.key; updateScreen(); }
        });

        // Evitar que toques en el overlay pasen al juego
        overlay.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
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