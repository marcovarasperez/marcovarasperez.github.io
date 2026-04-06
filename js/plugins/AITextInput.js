var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // Limpieza previa por si acaso
        var existing = document.getElementById('ai-input-overlay');
        if (existing) document.body.removeChild(existing);

        var text = '';
        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        
        // ESTILOS CRÍTICOS PARA MÓVIL
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.9);
            z-index: 20000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            touch-action: none;
            -webkit-user-select: none;
        `;

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e; border:2px solid #e0c97f; border-radius:8px; padding:10px; width:95%; max-width:400px; box-sizing:border-box;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#000; border:1px solid #e0c97f; border-radius:4px; padding:8px; min-height:35px; color:#fff; font-size:16px; margin-bottom:10px; word-break:break-all; text-align:center;';
        
        function updateScreen() { screen.textContent = text; }

        function onConfirm() {
            if (text.trim() === '') return;
            $gameVariables.setValue(2, text.trim());
            document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

        // GESTOR DE EVENTOS PARA MÓVIL (Sustituye al click)
        function bind(btn, fn) {
            // Usamos pointerdown que es el estándar moderno para móvil y PC
            btn.addEventListener('pointerdown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fn();
            }, { passive: false });
        }

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        var btnBase = 'background:#2a2a4e; color:#e0c97f; border:1px solid #e0c97f; border-radius:4px; padding:12px 2px; font-size:14px; font-weight:bold; flex:1; margin:2px; touch-action:manipulation;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.marginBottom = '4px';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                btn.style.cssText = btnBase;

                if (key === 'CONFIRMAR') {
                    btn.style.background = '#e0c97f';
                    btn.style.color = '#1a1a2e';
                    btn.style.flex = '2';
                    bind(btn, onConfirm);
                } else if (key === 'ESPACIO') {
                    btn.style.flex = '3';
                    bind(btn, function() { if(text.length < 50) { text += ' '; updateScreen(); }});
                } else if (key === '⌫') {
                    btn.style.flex = '1.5';
                    bind(btn, function() { text = text.slice(0,-1); updateScreen(); });
                } else {
                    bind(btn, function() { if(text.length < 50) { text += key.toLowerCase(); updateScreen(); }});
                }
                rowDiv.appendChild(btn);
            });
            box.appendChild(rowDiv);
        });

        box.insertBefore(screen, box.firstChild);
        overlay.appendChild(box);
        
        // AGREGAR AL FINAL DEL BODY
        document.body.appendChild(overlay);
    };

    // Registro del comando
    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') AITextInput.showInput(this);
    };

    // Manejo del Wait
    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_input') {
            if (!document.getElementById('ai-input-overlay')) {
                this._waitMode = '';
                return false;
            }
            return true;
        }
        return _updateWaitMode.call(this);
    };

})();