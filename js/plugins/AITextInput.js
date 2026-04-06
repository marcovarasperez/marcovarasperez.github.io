var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var isMobile = window.innerWidth < 768;

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100000;display:flex;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        // MAXIMO ANCHO: 98% de la pantalla en móvil
        var boxWidth = isMobile ? '98vw' : '450px'; 
        // MINIMO ALTO: Padding de solo 2px
        box.style.cssText = 'background:#1a1a2e;border:1px solid #e0c97f;border-radius:4px;padding:2px;width:' + boxWidth + ';max-width:500px;box-sizing:border-box;';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        // Título casi pegado
        title.style.cssText = 'color:#e0c97f;font-size:9px;margin:1px 0;text-align:center;text-transform:uppercase;opacity:0.8;';

        var screen = document.createElement('input');
        screen.type = 'text';
        screen.readOnly = true;
        screen.setAttribute('autocorrect', 'off');
        screen.setAttribute('spellcheck', 'false');
        // Pantalla ultra-chata: 18px de alto
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:2px;padding:0 4px;height:18px;width:100%;color:#ffffff;font-size:11px;margin-bottom:2px;box-sizing:border-box;text-align:center;';

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

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M',',','.',';'],
            ['¿','?','¡','!','-',':','ESPACIO','⌫'],
            ['CONFIRMAR']
        ];

        // BOTONES ULTRA-CHATOS: 20px de altura en móvil
        var btnFontSize = isMobile ? '9px' : '11px';
        var btnHeight = isMobile ? '20px' : '28px';

        var btnBase = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:2px;padding:0;font-size:' + btnFontSize + ';height:' + btnHeight + ';cursor:pointer;flex:1;margin:0.5px;box-sizing:border-box;touch-action:manipulation;line-height:1;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;width:100%;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                
                if (key === 'CONFIRMAR') {
                    // Confirmar más bajo también para mantener el estilo
                    btn.style.cssText = btnBase + 'background:#e0c97f;color:#1a1a2e;font-weight:bold;width:100%;flex:none;margin-top:1px;height:22px;';
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnBase + 'flex:2.5;';
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