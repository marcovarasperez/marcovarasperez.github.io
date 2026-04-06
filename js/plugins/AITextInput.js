var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
        // Añadido 'touch-action: none' para evitar scroll accidental
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:16px;width:95%;max-width:500px;box-sizing:border-box;';
        box.style.cssText = 'background:#1a1a2e;border:2px solid #e0c97f;border-radius:8px;padding:12px;width:95%;max-width:450px;box-sizing:border-box;';

        // Título
        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:16px;margin:0 0 10px 0;text-align:center;';
        title.style.cssText = 'color:#e0c97f;font-size:16px;margin:0 0 8px 0;text-align:center;font-family:sans-serif;';

        // Pantalla de texto
        var screen = document.createElement('div');
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:10px;min-height:40px;color:#ffffff;font-size:16px;margin-bottom:12px;word-break:break-all;';
        screen.style.cssText = 'background:#0f0f1a;border:1px solid #e0c97f;border-radius:4px;padding:10px;min-height:40px;color:#ffffff;font-size:16px;margin-bottom:12px;word-break:break-all;font-family:monospace;';

        var text = '';

        function updateScreen() {
            screen.textContent = text || '';
        }

        // Teclado físico
        document.addEventListener('keydown', onKeyDown);
        // Función para asignar eventos táctiles/click sin lag
        function bindButton(btn, action) {
            btn.addEventListener('pointerdown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                action();
            });
        }

        function onKeyDown(e) {
            if (e.key === 'Enter') {
                confirm();
            } else if (e.key === 'Backspace') {
                text = text.slice(0, -1);
                updateScreen();
            } else if (e.key.length === 1 && text.length < 80) {
                text += e.key;
                updateScreen();
            }
            e.stopPropagation();
            e.preventDefault();
        }

        document.addEventListener('keydown', onKeyDown);

        function confirm() {
            if (text.trim() === '') return;
            $gameVariables._data[2] = text.trim();
            $gameVariables.setValue(2, text.trim());
            document.removeEventListener('keydown', onKeyDown);
            document.body.removeChild(overlay);
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            interpreter.setWaitMode('');
        }

        // Filas del teclado virtual
       var rows = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['Z','X','C','V','B','N','M','⌫'],
    ['ESPACIO','CONFIRMAR']
];
        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        var btnStyle = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:8px 4px;font-size:14px;cursor:pointer;flex:1;margin:2px;min-width:28px;';
        // Estilo base con touch-action para móviles
        var btnStyle = 'background:#2a2a4e;color:#e0c97f;border:1px solid #e0c97f;border-radius:4px;padding:10px 2px;font-size:14px;cursor:pointer;flex:1;margin:2px;min-width:28px;touch-action:manipulation;user-select:none;-webkit-user-select:none;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:4px;';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;

                if (key === 'CONFIRMAR') {
                    btn.style.cssText = 'background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:8px 16px;font-size:14px;cursor:pointer;font-weight:bold;margin:2px;flex:2;';
                    btn.onclick = confirm;
                    btn.style.cssText = 'background:#e0c97f;color:#1a1a2e;border:none;border-radius:4px;padding:10px 16px;font-size:14px;cursor:pointer;font-weight:bold;margin:2px;flex:2;touch-action:manipulation;';
                    bindButton(btn, confirm);
                } else if (key === 'ESPACIO') {
                    btn.style.cssText = btnStyle + 'flex:3;';
                    btn.onclick = function() {
                    bindButton(btn, function() {
                        if (text.length < 80) {
                            text += ' ';
                            updateScreen();
                        }
                    };
                    });
                } else if (key === '⌫') {
                    btn.style.cssText = btnStyle + 'flex:1.5;';
                    btn.onclick = function() {
                    bindButton(btn, function() {
                        text = text.slice(0, -1);
                        updateScreen();
                    };
                    });
                } else {
                    btn.style.cssText = btnStyle;
                    btn.onclick = function() {
                    bindButton(btn, function() {
                        if (text.length < 80) {
                            text += key.toLowerCase();
                            updateScreen();
                        }
                    };
                    });
                }

                rowDiv.appendChild(btn);
            });

            box.appendChild(rowDiv);
        });

        // Evitar que el toque cierre el teclado si se pulsa fuera de los botones
        overlay.addEventListener('pointerdown', function(e) {
            if (e.target === overlay) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') {
            AITextInput.showInput(this);
        }
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_input') {
            // Si el overlay ya no existe, liberar el wait mode
            if (!document.getElementById('ai-input-overlay')) {
                this._waitMode = '';
                return false;
            }
            return true;
        }
        return _updateWaitMode.call(this);
    };