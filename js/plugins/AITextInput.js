var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // Detectar si es móvil (pantalla menor a 768px)
        var isMobile = window.innerWidth < 768;
        var scale = isMobile ? '0.8' : '1'; // Factor de escala para fuentes

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        // CAMBIO CLAVE: Aquí aplicamos el 80% de ancho en móvil
        var boxWidth = isMobile ? '80%' : '95%';
        var boxMaxWidth = isMobile ? '320px' : '500px';
        
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:' + (isMobile ? '8px' : '16px') + ';width:' + boxWidth + ';max-width:' + boxMaxWidth + ';box-sizing:border-box;';

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:' + (isMobile ? '10px' : '12px') + ';margin:0 0 5px 0;text-align:center;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:2px;padding:6px;min-height:' + (isMobile ? '10px' : '15px') + ';color:#ffffff;font-size:' + (isMobile ? '10px' : '12px') + ';margin-bottom:6px;word-break:break-all;pointer-events:none;';

        var text = '';
        function updateScreen() { screen.textContent = text || ''; }

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

        // Estilo de botones adaptativo
        var btnPadding = isMobile ? '6px 2px' : '12px 4px';
        var btnFontSize = isMobile ? '10px' : '14px';
        var btnStyle = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:' + btnPadding + ';font-size:' + btnFontSize + ';cursor:pointer;flex:1;margin:1px;min-width:20px;touch-action:manipulation;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:' + (isMobile ? '2px' : '4px') + ';';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                
                if (key === 'CONFIRMAR') {
                    btn.style.cssText = 'background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:' + btnPadding + ';font-size:' + btnFontSize + ';cursor:pointer;font-weight:bold;margin:1px;flex:2;';
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnStyle + 'flex:3;';
                } else if (key === '⌫') {
                    btn.style.cssText = btnStyle + 'flex:1.5;';
                } else {
                    btn.style.cssText = btnStyle;
                }

                btn.addEventListener('pointerdown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === 'CONFIRMAR') confirm();
                    else if (key === 'ESPACIO') { if (text.length < 80) { text += ' '; updateScreen(); } }
                    else if (key === '⌫') { text = text.slice(0, -1); updateScreen(); }
                    else { if (text.length < 80) { text += key.toLowerCase(); updateScreen(); } }
                });

                rowDiv.appendChild(btn);
            });
            box.appendChild(rowDiv);
        });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        overlay.addEventListener('pointerdown', function(e) {
            if (e.target === overlay) { e.preventDefault(); e.stopPropagation(); }
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